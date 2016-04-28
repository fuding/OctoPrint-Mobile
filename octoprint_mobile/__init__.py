# coding=utf-8
from __future__ import absolute_import

import octoprint.plugin
import logging
import logging.handlers

import ConfigParser, hashlib, os
import re
from flask import make_response, render_template, jsonify, url_for, request

__plugin_name__ = "Mobile UI"

class MobileUIPlugin(octoprint.plugin.UiPlugin,
	 		octoprint.plugin.TemplatePlugin,
			octoprint.plugin.AssetPlugin,
			octoprint.plugin.BlueprintPlugin):
					
	def initialize(self):
		self._logger.info("Mobile UI for Octoprint Viewer available")

	def will_handle_ui(self, request):
		#to allow mobile UI on any mobile device uncomment the second half of the return condition
		# and use http(s)://__youip__?apikey=99999999999999
		return request.user_agent.string.startswith("Octoprint Mobile") # or request.user_agent.platform in ("ipad", "iphone", "android")
		
	def on_ui_render(self, now, request, render_kwargs):		
		mobile_url="plugin/%s"%self._identifier
		if self._plugin_manager.get_plugin("switch"):
			has_switch="true"
		else:
			has_switch="false"
		return make_response(render_template("mobile_ui_index.jinja2", mobile_url=mobile_url, has_switch=has_switch) )

	@octoprint.plugin.BlueprintPlugin.route("/home", methods=["GET"])
	def check_home(self):
		self._logger.info("X-Forwarded-For : [%s]"%request.headers.getlist("X-Forwarded-For"))
		for remote in request.headers.getlist("X-Forwarded-For"): #always via haproxy
			if remote.split('.')[0] != '192':
				return jsonify(home=False)
		return jsonify(home=True)
	
	@octoprint.plugin.BlueprintPlugin.route("/unselect", methods=["GET"])
	def unselect_file(self):
			self._printer.unselect_file()
			return 'OK'
			
	@octoprint.plugin.BlueprintPlugin.route("/gcodes/<identifier>", methods=["GET"])
	def get_ini_gcodes(self, identifier):
		gcodes = ConfigParser.ConfigParser()
		inifile = os.path.join(self._basefolder, "gcodes.ini")
		if os.path.isfile(os.path.join(self.get_plugin_data_folder(), "gcodes.ini")):
			inifile = os.path.join(self.get_plugin_data_folder(), "gcodes.ini")
			
		gcodes.read(inifile)
		md5 = hashlib.md5(open(inifile, 'rb').read()).hexdigest()
		#self._logger.debug("gcode version: remote ["  +identifier +"] vs local ["+md5+"] ...")
		if identifier == md5:
			return jsonify(update=False)
		else:
			self._logger.info("new gcode version: remote ["  +identifier +"] vs local [" + md5 + "] ...")
			retval = {'update':True, 'id':md5}
			for section in gcodes.sections():
				view = gcodes.items(section)
				commands = {} 
				for key,value in view:
					#remove all extra spaces
					commands.update({key: ",".join(map(str.strip, re.sub( '\s+', ' ', value).split(',')) )})
				retval.update({section: commands})
			return jsonify(retval)

	def custom_action_handler(self, comm, line, action, *args, **kwargs):
		if action[:7] == "zchange":
			self._plugin_manager.send_plugin_message(self._identifier, dict(zchange = action[8:]))
			

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = MobileUIPlugin()

	global __plugin_hooks__
	__plugin_hooks__ = {"octoprint.comm.protocol.action": __plugin_implementation__.custom_action_handler}
			





	
