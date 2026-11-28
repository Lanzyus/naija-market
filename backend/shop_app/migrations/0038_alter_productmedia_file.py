from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop_app', '0037_convert_product_types_text'),
    ]

    operations = [
        migrations.AlterField(
            model_name='productmedia',
            name='file',
            field=models.FileField(max_length=255, upload_to='product_media/'),
        ),
    ]
