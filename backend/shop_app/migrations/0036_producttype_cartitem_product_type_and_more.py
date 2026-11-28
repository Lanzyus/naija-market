import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop_app', '0035_product_product_types'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('sku', models.CharField(blank=True, max_length=100, null=True)),
                ('price', models.DecimalField(decimal_places=2, max_digits=12)),
                ('discounted_price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('cost_price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('stock_quantity', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='types', to='shop_app.product')),
            ],
            options={
                'ordering': ['id'],
                'unique_together': {('product', 'name')},
            },
        ),
        migrations.AddField(
            model_name='cartitem',
            name='product_type',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='shop_app.producttype'),
        ),
        migrations.AddField(
            model_name='orderitem',
            name='product_type_name',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
