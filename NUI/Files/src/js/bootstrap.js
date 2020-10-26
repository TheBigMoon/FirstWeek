(function() {
    require.config({
        paths: {
            "StructureExplorerComponent": Terrasoft.getFileContentUrl("NUI", "src/js/structure-explorer-component.js"),
           
        },
        shim: {
            "StructureExplorerComponent": {
                deps: ["ng-core"]
            }
        }
    });
})();
