# -*- coding: utf-8 -*-
from odoo import models, fields

class Website(models.Model):
    _inherit = 'website'

    enable_simple_address = fields.Boolean(
        string='Enable Simple Address on Checkout',
        default=False,
    )