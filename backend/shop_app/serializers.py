# shop_app/serializers.py

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    Banner,
    Cart,
    CartItem,
    Category,
    ContactMessage,
    Coupon,
    Order,
    OrderItem,
    Product,
    ProductMedia,
    ProductQuestion,
    ProductReview,
    ProductSpecification,
    ProductVariant,
    RecentlyViewed,
    Shipment,
    ShipmentTracking,
    StockMovement,
    SubCategory,
    Wishlist,
)

User = get_user_model()


# ==================================================
# SHIPMENT TRACKING
# ==================================================
class ShipmentTrackingSerializer(serializers.ModelSerializer):

    class Meta:
        model = ShipmentTracking
        fields = [
            "id",
            "status",
            "location",
            "note",
            "created_at",
        ]


# ==================================================
# SHIPMENT
# ==================================================
class ShipmentSerializer(serializers.ModelSerializer):

    tracking_updates = ShipmentTrackingSerializer(many=True, read_only=True)

    order_id = serializers.IntegerField(source="order.id", read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_username = serializers.CharField(
        source="order.user.username", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    courier_display = serializers.CharField(
        source="get_courier_display", read_only=True
    )

    class Meta:
        model = Shipment
        fields = [
            "id",
            "order_id",
            "order_number",
            "customer_username",
            "courier",
            "courier_display",
            "tracking_number",
            "status",
            "status_display",
            "shipped_at",
            "delivered_at",
            "created_at",
            "tracking_updates",
        ]


# ==================================================
# STOCK MOVEMENT
# ==================================================
class StockMovementSerializer(serializers.ModelSerializer):

    class Meta:
        model = StockMovement
        fields = "__all__"


# ==================================================
# PRODUCT QUESTION
# ==================================================
class ProductQuestionSerializer(serializers.ModelSerializer):

    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ProductQuestion
        fields = "__all__"


# ==================================================
# PRODUCT SPECIFICATION
# ==================================================
class ProductSpecificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductSpecification
        fields = "__all__"


# ==================================================
# REGISTER
# ==================================================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "username",
            "email",
            "password",
            "confirm_password",
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match"}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)

        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            password=validated_data["password"],
        )


# ==================================================
# PROFILE UPDATE
# ==================================================
class ProfileUpdateSerializer(serializers.ModelSerializer):

    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "country",
            "state",
            "city",
            "address",
            "profile_picture",
            "profile_picture_url",
        ]
        read_only_fields = ["profile_picture_url"]

    def get_profile_picture_url(self, obj):
        if not obj.profile_picture:
            return None

        try:
            url = obj.profile_picture.url
        except ValueError:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(url)

        return url


# ==================================================
# USER
# ==================================================
class UserSerializer(serializers.ModelSerializer):

    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "city",
            "state",
            "country",
            "address",
            "profile_picture",
            "profile_picture_url",
        ]
        read_only_fields = [
            "id",
            "profile_picture_url",
        ]

    def get_profile_picture_url(self, obj):
        if not obj.profile_picture:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.profile_picture.url)

        return obj.profile_picture.url


# ==================================================
# JWT TOKEN
# ==================================================
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["user_id"] = user.id
        token["username"] = user.username
        token["email"] = user.email
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name

        # Admin information
        token["is_staff"] = user.is_staff
        token["is_superuser"] = user.is_superuser

        return token


# ==================================================
# CONTACT
# ==================================================
class ContactMessageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ContactMessage
        fields = "__all__"


# ==================================================
# BANNER
# ==================================================
class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = "__all__"

    def get_image(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.image.url)

        return obj.image.url


# ==================================================
# PRODUCT MEDIA
# ==================================================
class ProductMediaSerializer(serializers.ModelSerializer):

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductMedia
        fields = [
            "id",
            "media_type",
            "file",
            "file_url",
            "is_primary",
            "created_at",
        ]

    def get_file_url(self, obj):
        if not obj.file:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.file.url)

        return obj.file.url


# ==================================================
# PRODUCT VARIANT
# ==================================================
class ProductVariantSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductVariant
        fields = "__all__"


# ==================================================
# PRODUCT REVIEW
# ==================================================
class ProductReviewSerializer(serializers.ModelSerializer):

    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "username",
            "rating",
            "comment",
            "created_at",
        ]


# ==================================================
# CATEGORY
# ==================================================
class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "image",
        ]


# ==================================================
# SUB CATEGORY
# ==================================================
class SubCategorySerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = SubCategory
        fields = [
            "id",
            "name",
            "slug",
            "image",
            "category",
            "category_name",
        ]


# ==================================================
# CATEGORY DETAIL
# ==================================================
class CategoryDetailSerializer(serializers.ModelSerializer):

    subcategories = SubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "image",
            "subcategories",
        ]


# ==================================================
# PRODUCT (LIST)
# ==================================================


class ProductTypesField(serializers.Field):
    """
    Converts comma-separated product types in the database
    into a list for the API, and accepts either a list or
    comma-separated text when saving.
    """

    def to_representation(self, value):
        if not value:
            return []

        return [
            item.strip()
            for item in value.split(",")
            if item.strip()
        ]

    def to_internal_value(self, data):
        if not data:
            return ""

        if isinstance(data, list):
            return ", ".join(
                str(item).strip()
                for item in data
                if str(item).strip()
            )

        if isinstance(data, str):
            return ", ".join(
                item.strip()
                for item in data.split(",")
                if item.strip()
            )

        raise serializers.ValidationError(
            "Product types must be comma-separated text or a list."
        )



class ProductSerializer(serializers.ModelSerializer):
    is_new = serializers.SerializerMethodField()
    current_price = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()

    media = ProductMediaSerializer(many=True, read_only=True)

    product_types = ProductTypesField(required=False)

    category_name = serializers.CharField(source="category.name", read_only=True)
    subcategory_name = serializers.CharField(
        source="subcategory.name", read_only=True
    )

    # Read from the Product model properties
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "short_description",
            "brand",
            "sku",
            "price",
            "discounted_price",
            "current_price",
            "stock_quantity",
            "rating",
            "total_reviews",
            "is_featured",
            "is_active",
            "product_types",
            "category",
            "category_name",
            "subcategory",
            "subcategory_name",
            "primary_image",
            "media",
            "is_new",
            "created_at",
            "updated_at",
            "average_rating",
            "review_count",
        ]

    def get_is_new(self, obj):
        """A product is new if it was created within the last 7 days."""
        if not obj.created_at:
            return False

        return obj.created_at >= (timezone.now() - timedelta(days=7))

    def get_current_price(self, obj):
        """Discounted price if available, otherwise the regular price."""
        if obj.discounted_price and obj.discounted_price > 0:
            return obj.discounted_price

        return obj.price

    def get_primary_image(self, obj):
        """Primary image URL, falling back to the first image."""
        media = obj.media.filter(media_type="image", is_primary=True).first()

        if not media:
            media = obj.media.filter(media_type="image").first()

        if media and media.file:
            request = self.context.get("request")

            if request:
                return request.build_absolute_uri(media.file.url)

            return media.file.url

        return None


# ==================================================
# PRODUCT DETAIL
# ==================================================
class DetailedProductSerializer(serializers.ModelSerializer):
    media = ProductMediaSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    questions = ProductQuestionSerializer(many=True, read_only=True)

    current_price = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    similar_products = serializers.SerializerMethodField()

    product_types = ProductTypesField(required=False)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "short_description",
            "brand",
            "product_types",
            "sku",
            "price",
            "discounted_price",
            "current_price",
            "stock_quantity",
            "rating",
            "total_reviews",
            "average_rating",
            "review_count",
            "is_featured",
            "is_active",
            "category",
            "subcategory",
            "media",
            "variants",
            "reviews",
            "specifications",
            "questions",
            "similar_products",
            "created_at",
        ]

    def get_current_price(self, obj):
        return obj.current_price

    def get_average_rating(self, obj):
        """Average of review ratings, falling back to product.rating."""
        reviews = obj.reviews.all()

        if reviews.exists():
            avg = sum(review.rating for review in reviews) / reviews.count()
            return round(avg, 1)

        return obj.rating if obj.rating else 0

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_similar_products(self, obj):
        """Up to 8 other active products from the same category."""
        products = Product.objects.filter(
            category=obj.category,
            is_active=True,
        ).exclude(id=obj.id)[:8]

        return ProductSerializer(
            products,
            many=True,
            context=self.context,
        ).data


# ==================================================
# CART ITEM
# ==================================================
class CartItemSerializer(serializers.ModelSerializer):

    product = ProductSerializer(read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "quantity",
            "total",
        ]

    def get_total(self, obj):
        return float(obj.product.current_price * obj.quantity)


# ==================================================
# CART
# ==================================================
class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(many=True, read_only=True)
    num_of_items = serializers.SerializerMethodField()
    sum_total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "cart_code",
            "paid",
            "num_of_items",
            "sum_total",
            "items",
            "created_at",
            "updated_at",
        ]

    def get_num_of_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_sum_total(self, obj):
        total = Decimal("0.00")

        for item in obj.items.all():
            total += item.product.current_price * item.quantity

        return float(total)


# ==================================================
# WISHLIST
# ==================================================
class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = "__all__"
        read_only_fields = ["user"]


# ==================================================
# RECENTLY VIEWED
# ==================================================
class RecentlyViewedSerializer(serializers.ModelSerializer):

    product = ProductSerializer(read_only=True)

    class Meta:
        model = RecentlyViewed
        fields = [
            "id",
            "product",
            "viewed_at",
        ]


# ==================================================
# ORDER ITEM
# ==================================================
class OrderItemSerializer(serializers.ModelSerializer):

    product_id = serializers.IntegerField(
        source="product.id", read_only=True, allow_null=True
    )
    product_name = serializers.CharField(
        source="product.name", read_only=True, allow_null=True
    )
    product_slug = serializers.CharField(
        source="product.slug", read_only=True, allow_null=True
    )
    product_image = serializers.SerializerMethodField()

    # Product has no "shop" relation, so this is always null.
    # Kept so existing frontend code reading it doesn't break.
    shop_name = serializers.CharField(
        source="product.shop.name", read_only=True, allow_null=True
    )
    seller_username = serializers.CharField(
        source="product.seller.username", read_only=True, allow_null=True
    )

    total_price = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            # Product
            "product_id",
            "product_name",
            "product_slug",
            "product_image",
            # Seller / shop
            "shop_name",
            "seller_username",
            # Order item
            "quantity",
            "unit_price",
            "total_price",
        ]
        read_only_fields = fields

    def get_product_image(self, obj):
        product = getattr(obj, "product", None)

        if not product:
            return None

        # Primary image, falling back to the first image
        media = product.media.filter(media_type="image", is_primary=True).first()

        if not media:
            media = product.media.filter(media_type="image").first()

        if not media or not media.file:
            return None

        try:
            image_url = media.file.url
        except ValueError:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(image_url)

        return image_url

    def get_total_price(self, obj):
        quantity = obj.quantity or 0
        unit_price = obj.unit_price if obj.unit_price is not None else Decimal("0.00")

        return quantity * unit_price


# ==================================================
# ORDER (LIST)
# ==================================================
# ==================================================
# ORDER CUSTOMER / DELIVERY FIELDS (shared)
# ==================================================
class OrderCustomerFieldsMixin(serializers.Serializer):
    """Customer + delivery details for an order.

    Uses what checkout saved on the Transaction first, then falls back to the
    customer's profile, so nothing is blank when we actually know it.
    """

    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    state = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    shipping_address = serializers.SerializerMethodField()

    def _pick(self, obj, field, user_attrs=None):
        tx = getattr(obj, "transaction", None)
        value = getattr(tx, field, None) if tx else None
        if value:
            return value

        # value stored on the order itself (city / shipping_address)
        value = getattr(obj, field, None)
        if value and isinstance(value, str) and value.strip():
            return value

        user = getattr(obj, "user", None)
        for attr in (user_attrs or (field,)):
            value = getattr(user, attr, None) if user else None
            if value:
                return value
        return ""

    def get_full_name(self, obj):
        value = self._pick(obj, "full_name", ())
        if value:
            return value
        user = getattr(obj, "user", None)
        if user:
            return user.get_full_name() or user.username
        return ""

    def get_email(self, obj):
        return self._pick(obj, "email")

    def get_phone(self, obj):
        return self._pick(obj, "phone", ("phone", "phone_number"))

    def get_country(self, obj):
        return self._pick(obj, "country")

    def get_state(self, obj):
        return self._pick(obj, "state")

    def get_city(self, obj):
        return self._pick(obj, "city")

    def get_shipping_address(self, obj):
        return self._pick(obj, "shipping_address", ("address", "shipping_address"))


class OrderSerializer(OrderCustomerFieldsMixin, serializers.ModelSerializer):

    # The frontend consistently uses "orderitems"
    orderitems = OrderItemSerializer(source="items", many=True, read_only=True)
    shipment = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_method",
            "payment_type",
            "payment_status",
            "subtotal",
            "vat",
            "delivery_fee",
            "total_amount",
            "created_at",
            "full_name",
            "email",
            "phone",
            "country",
            "state",
            "city",
            "shipping_address",
            "orderitems",
            "shipment",
        ]
        read_only_fields = fields

    def get_shipment(self, obj):
        shipment = getattr(obj, "shipment", None)

        if not shipment:
            return None

        return ShipmentSerializer(shipment, context=self.context).data


# ==================================================
# ORDER (DETAIL)
# ==================================================

class OrderDetailSerializer(OrderCustomerFieldsMixin, serializers.ModelSerializer):

    orderitems = OrderItemSerializer(source="items", many=True, read_only=True)
    shipment = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_method",
            "payment_type",
            "payment_status",
            "full_name",
            "email",
            "phone",
            "country",
            "state",
            "shipping_address",
            "city",
            "subtotal",
            "vat",
            "delivery_fee",
            "total_amount",
            "created_at",
            "orderitems",
            "shipment",
        ]
        read_only_fields = fields

    def get_shipment(self, obj):
        shipment = getattr(obj, "shipment", None)

        if not shipment:
            return None

        return ShipmentSerializer(shipment, context=self.context).data


# ==================================================
# COUPON
# ==================================================
class CouponSerializer(serializers.ModelSerializer):

    class Meta:
        model = Coupon
        fields = "__all__"