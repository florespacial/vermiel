# -*- coding: utf-8 -*-
from odoo import models, fields

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    enable_simple_address = fields.Boolean(
        string='Enable Simple Address',
        related='website_id.enable_simple_address',
        readonly=False,
    )
