from django.contrib import admin
from .models import Product, ProductType, Cart, CartItem
from .models import ProductMedia
from .models import *
from .models import (
    Category,
    SubCategory
)
from .models import Banner

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "is_active",
        "created_at",
    )

    list_filter = ("is_active",)

    search_fields = ("title",)





# Register your models here.



class ProductTypeInline(admin.TabularInline):
    """Add each type (e.g. 35cl, 50cl, 1 Litre) with its own price and stock."""

    model = ProductType
    extra = 1
    fields = (
        "name",
        "price",
        "discounted_price",
        "cost_price",
        "stock_quantity",
        "sku",
        "is_active",
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductTypeInline]
    # Types now live in the table below; the old comma-separated text is hidden.
    exclude = ("product_types",)
    list_display = ("name", "category", "price", "stock_quantity", "is_active")
    search_fields = ("name", "sku")


admin.site.register(ProductType)
admin.site.register(ProductMedia)
admin.site.register(ProductVariant)
admin.site.register(ProductReview)
admin.site.register(Wishlist)
admin.site.register(RecentlyViewed)
admin.site.register(Coupon)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Transaction)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Shipment)
admin.site.register(Category)
admin.site.register(SubCategory)
admin.site.register(ContactMessage)