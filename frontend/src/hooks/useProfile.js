import { useCallback, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api";

// GET /user/ returns the signed-in customer (name, email, phone, address, city, state, country).
// One shared fetch per access token, so Orders + Invoice + Checkout don't each refetch.
let cache = { token: null, profile: null, inflight: null };

const readUser = () => {
  try {
    const token = localStorage.getItem("access");
    if (!token) return {};
    const d = jwtDecode(token);
    return {
      id: d.user_id ?? d.id,
      username: d.username,
      first_name: d.first_name,
      last_name: d.last_name,
      email: d.email,
    };
  } catch {
    return {};
  }
};

// Fill blanks in the fetched profile with what the login token already knows.
const withTokenBackup = (fetched) => {
  const t = readUser();
  const base = { first_name: t.first_name || "", last_name: t.last_name || "", email: t.email || "" };
  if (!fetched) return t.first_name || t.last_name || t.email ? base : null;
  const merged = { ...fetched };
  Object.entries(base).forEach(([k, v]) => {
    if (!merged[k] && v) merged[k] = v;
  });
  return merged;
};

/** Signed-in customer's profile (GET /profile/update/) + who they are. */
export default function useProfile() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("access") : null;
  const [profile, setProfile] = useState(cache.token === token ? cache.profile : null);
  const [loading, setLoading] = useState(!!token && !(cache.token === token && cache.profile));
  const [error, setError] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!token) {
        setProfile(null);
        setLoading(false);
        return null;
      }
      if (!force && cache.token === token && cache.profile) {
        setProfile(cache.profile);
        setLoading(false);
        return cache.profile;
      }
      try {
        setLoading(true);
        setError(false);
        if (cache.token !== token || !cache.inflight || force) {
          cache = { token, profile: null, inflight: api.get("/user/").then((r) => r.data) };
        }
        const data = withTokenBackup(await cache.inflight);
        cache.profile = data;
        cache.inflight = null;
        setProfile(data);
        return data;
      } catch {
        cache.inflight = null;
        setError(true);
        const backup = withTokenBackup(null); // /user/ failed: still use name/email from the login token
        setProfile(backup);
        return backup;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { profile, loading, error, reload: () => load(true), currentUser: readUser() };
}
