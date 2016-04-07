# coding=utf-8
from __future__ import absolute_import

import octoprint.plugin
import logging
import logging.handlers

from flask import make_response, render_template, jsonify

class MobileUIPlugin(octoprint.plugin.UiPlugin,
	 		octoprint.plugin.TemplatePlugin,
			octoprint.plugin.AssetPlugin,
			octoprint.plugin.SimpleApiPlugin):
					
	def initialize(self):
		self._logger.info("Mobile UI for Octoprint Viewer available")

	def will_handle_ui(self, request):
		return request.user_agent.string.startswith("Octoprint Viewer")
		
	def on_ui_render(self, now, request, render_kwargs):
		return make_response(render_template("mobile_ui_index.jinja2", **render_kwargs))

	def on_api_get(self, request):
		for remote in request.headers.getlist("X-Forwarded-For"):
			if remote.split('.')[0] != '192':
				return jsonify(home=False)
		return jsonify(home=True)
		

__plugin_name__ = "Mobile UI"
__plugin_implementation__ = MobileUIPlugin()


	
