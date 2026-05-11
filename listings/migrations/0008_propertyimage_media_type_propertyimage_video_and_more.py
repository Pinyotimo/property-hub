from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0007_property_address_property_city_property_description_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertyimage',
            name='media_type',
            field=models.CharField(choices=[('image', 'Image'), ('video', 'Video')], default='image', max_length=10),
        ),
        migrations.AddField(
            model_name='propertyimage',
            name='video',
            field=models.FileField(blank=True, null=True, upload_to='property_videos/'),
        ),
        migrations.AlterField(
            model_name='propertyimage',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='property_images/'),
        ),
    ]
