from django.db import migrations


def text_types_to_rows(apps, schema_editor):
    """Turn the old comma-separated product_types text into ProductType rows.

    Every type starts with the product's current price and stock, so nothing
    changes for customers until the prices are edited in the admin.
    """
    Product = apps.get_model("shop_app", "Product")
    ProductType = apps.get_model("shop_app", "ProductType")

    for product in Product.objects.exclude(product_types=""):
        seen = set()
        for raw in product.product_types.split(","):
            name = raw.strip()
            if not name or name.lower() in seen:
                continue
            seen.add(name.lower())
            ProductType.objects.get_or_create(
                product=product,
                name=name[:100],
                defaults={
                    "price": product.price,
                    "discounted_price": product.discounted_price,
                    "cost_price": product.cost_price,
                    "stock_quantity": product.stock_quantity,
                },
            )


class Migration(migrations.Migration):

    dependencies = [
        ('shop_app', '0036_producttype_cartitem_product_type_and_more'),
    ]

    operations = [
        migrations.RunPython(text_types_to_rows, migrations.RunPython.noop),
    ]
