# coding=utf-8
from __future__ import absolute_import

import octoprint.plugin
import logging
import logging.handlers

from flask import make_response, render_template, jsonify, url_for

class MobileUIPlugin(octoprint.plugin.UiPlugin,
	 		octoprint.plugin.TemplatePlugin,
			octoprint.plugin.AssetPlugin,
			octoprint.plugin.SimpleApiPlugin):
					
	def initialize(self):
		self._logger.info("Mobile UI for Octoprint Viewer available")

	def will_handle_ui(self, request):
		return request.user_agent.string.startswith("Octoprint Mobile")
		
	def on_ui_render(self, now, request, render_kwargs):		
		mobile_url="plugin/%s"%self._identifier
		if self._plugin_manager.get_plugin("switch"):
			has_switch="true"
		else:
			has_switch="false"
		return make_response(render_template("mobile_ui_index.jinja2", mobile_url=mobile_url, has_switch=has_switch) )

	def on_api_get(self, request):
		self._logger.info("X-Forwarded-For : [%s]"%request.headers.getlist("X-Forwarded-For"))
		for remote in request.headers.getlist("X-Forwarded-For"): #always via haproxy
			if remote.split('.')[0] != '192':
				return jsonify(home=False)
		return jsonify(home=True)
		

__plugin_name__ = "Mobile UI"
__plugin_implementation__ = MobileUIPlugin()


	
