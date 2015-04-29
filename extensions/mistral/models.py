from django.db import models


class Workbook(models.Model):
    name = models.CharField(max_length=50, unique=True)
    yaml = models.TextField()

