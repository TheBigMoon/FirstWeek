(function() {
	require.config({
		paths: {
			"page-wizard-component": Terrasoft.getFileContentUrl("DesignerTools", "src/js/page-wizard-component.js"),
			"EntityColumnPropertiesPageModule": Terrasoft.getFileContentUrl("DesignerTools", "src/js/EntityColumnPropertiesPageModule.js"),
			"ClientUnitParameterPropertiesPageModule": Terrasoft.getFileContentUrl("DesignerTools", "src/js/ClientUnitParameterPropertiesPageModule.js")
		},
		shim: {
			"page-wizard-component": {
				deps: ["ng-core"]
			}
		}
	});
}());
