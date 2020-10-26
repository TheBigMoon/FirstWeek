define("EntityColumnPropertiesPageModule", [
		"ModalBox",
		"SchemaModelItemDesignerResources",
		"MaskHelper",
		"EntitySchemaColumnDesignerResources",
		"BaseDesignerResources",
		"BaseSchemaViewModelResources",
		"PageDesignerUtilitiesResources",
		"BaseSectionMainSettingsResources",
		"BaseModule",
		"page-wizard-component"
	],
	function(
		ModalBox,
		resources,
		MaskHelper,
		entitySchemaColumnDesignerResources,
		baseDesignerResources,
		baseSchemaViewModelResources,
		pageDesignerUtilitiesResources,
		baseSectionMainSettingsResources
		) {
	Ext.define("Terrasoft.EntityColumnPropertiesPageModule", {
		extend: "Terrasoft.configuration.BaseModule",

		mixins: {
			customEvent: "Terrasoft.CustomEventDomMixin"
		},

		messages: {
			"ChangeHeaderCaption": {
				mode: Terrasoft.MessageMode.PTP,
				direction: Terrasoft.MessageDirectionType.PUBLISH
			},

			"GetColumnConfig": {
				mode: Terrasoft.MessageMode.PTP,
				direction: Terrasoft.MessageDirectionType.PUBLISH
			},

			"GetSchemaColumnsNames": {
				mode: Terrasoft.MessageMode.PTP,
				direction: Terrasoft.MessageDirectionType.PUBLISH
			},

			"GetDesignerDisplayConfig": {
				mode: Terrasoft.MessageMode.PTP,
				direction: Terrasoft.MessageDirectionType.PUBLISH
			},

			"GetNewLookupPackageUId": {
				mode: Terrasoft.MessageMode.PTP,
				direction: Terrasoft.MessageDirectionType.PUBLISH
			},

			"OnDesignerSaved": {
				mode: Terrasoft.MessageMode.PTP,
				direction: Terrasoft.MessageDirectionType.PUBLISH
			}
		},

		/**
		 * @type {Object} Resources.
		 */
		resources: null,

		// region Methods: Private

		/**
		 * @private
		 */
		_initCustomEvents: function() {
			this.sandbox.registerMessages(this.messages);
			const customEvent = this.mixins.customEvent;
			customEvent.init();
			customEvent.subscribeOnSandbox(this.sandbox, "GetColumnConfig", this.getColumnConfig, this).subscribe();
			customEvent.subscribe("Cancel").subscribe(this._cancel.bind(this));
			customEvent.subscribe("Save").subscribe(this._save.bind(this));
		},

		/**
		 * @private
		 */
		_getSchemaColumnsNamesWithoutCurrent: function(currentSchemaName) {
			const schemaColumnsNames = this.sandbox.publish("GetSchemaColumnsNames", null, [this.sandbox.id]);
			return schemaColumnsNames.filter(function(schemaName) {
				return schemaName !== currentSchemaName;
			});
		},

		/**
		 * @private
		 */
		_getValidationColumnConfig: function(viewModel) {
			const schemaColumnsNames = this._getSchemaColumnsNamesWithoutCurrent(viewModel.column.name);
			const maxColumnNameLength = Terrasoft.EntitySchemaManager.getMaxEntitySchemaNameWithPrefix();
			return {
				isInherited: viewModel.column.isInherited,
				schemaNamePrefix: Terrasoft.ClientUnitSchemaManager.schemaNamePrefix,
				schemaColumnsNames: schemaColumnsNames,
				maxColumnNameLength: maxColumnNameLength,
				maxColumnCaptionLength: Terrasoft.DesignTimeEnums.EntitySchemaColumnSizes.MAX_CAPTION_SIZE
			};
		},

		/**
		 * @private
		 */
		_updateModelItem: function(modelItem, data) {
			const itemConfig = modelItem.itemConfig;
			this._updateLabelConfig(itemConfig, data);
			itemConfig.enabled = !data.readOnly;
			this._updateNameConfig(modelItem, data);
			this._updateIsRequiredConfig(modelItem, data);
			this._updateMultilineTextConfig(modelItem, data);
		},

		/**
		 * @private
		 */
		_updateMultilineTextConfig: function(modelItem, data) {
			const itemConfig = modelItem.itemConfig;
				if (Terrasoft.isTextDataValueType(data.format)) {
				if (data.isMultilineText) {
					itemConfig.contentType = Terrasoft.ContentType.LONG_TEXT;
				} else {
					delete itemConfig.contentType;
					modelItem.set("rowSpan", 1);
				}
			}
		},

		/**
		 * @private
		 */
		_updateNameConfig: function(modelItem, data) {
			const itemConfig = modelItem.itemConfig;
			const columnName = data.name;
			if (itemConfig.bindTo) {
				const dataViewModel = modelItem.parentViewModel;
				itemConfig.bindTo = dataViewModel.getColumnPath(columnName);
			} else {
				itemConfig.name = columnName;
			}
		},

		/**
		 * @private
		 */
		_updateIsRequiredConfig: function(modelItem, data) {
			const itemConfig = modelItem.itemConfig;
			modelItem.$isRequired = data.isRequired;
			if (data.isRequiredOnPage) {
				itemConfig.isRequired = true;
			} else {
				delete itemConfig.isRequired;
			}
		},

		/**
		 * @private
		 */
		_updateLabelConfig: function(itemConfig, data) {
			const labelConfig = this._getLabelConfig(itemConfig, data);
			if (!Terrasoft.isEmptyObject(labelConfig)) {
				itemConfig.labelConfig = labelConfig;
			} else {
				delete itemConfig.labelConfig;
			}
		},

		/**
		 * @private
		 */
		_getLabelConfig: function(itemConfig, data) {
			const labelCaption = data.captionLabel;
			const columnCaption = data.caption;
			if (labelCaption === columnCaption) {
				return null;
			}
			const labelConfig = Ext.clone(itemConfig.labelConfig) || {};
			if (labelCaption) {
				const labelCaptionCultureValues = this._getCultureValues(labelCaption);
				labelConfig.captionLocalizableValue = new Terrasoft.LocalizableString({
					cultureValues: this._getSomeNotEmptyCultureValue(labelCaptionCultureValues)
						? labelCaptionCultureValues
						: {}
				});
				labelConfig.captionValue = labelConfig.captionLocalizableValue.getValue();
			}
			if (data.hideCaption) {
				labelConfig.visible = false;
			} else {
				delete labelConfig.visible;
			}
			return labelConfig;
		},


		/**
		 * @private
		 */
		_cancel: function() {
			ModalBox.close();
		},

		/**
		 * @private
		 */
		_save: function(data) {
			const modelItem = this.sandbox.publish("GetColumnConfig", null, [this.sandbox.id]);
			this._updateModelItem(modelItem, data);
			this._updateColumn(modelItem.column, data);
			this.sandbox.publish("OnDesignerSaved", modelItem, [this.sandbox.id]);
			ModalBox.close();
		},

		/**
		 * @private
		 */
		_getColumnCaption: function() {
			const config = this.sandbox.publish("GetDesignerDisplayConfig", null, [this.sandbox.id]);
			const columnConfig = this.sandbox.publish("GetColumnConfig", null, [this.sandbox.id]);
			const parentViewModel = columnConfig.parentViewModel;
			let caption = config && config.isNewColumn
				? this.resources.localizableStrings.NewColumnCaption
				: this.resources.localizableStrings.DesignerCaption;
			if (!parentViewModel.get("IsPrimary")) {
				caption += " (" + parentViewModel.get("Caption") + ")";
			}
			return caption;
		},

		/**
		 * @private
		 */
		_getCultureValues: function(localizableStringModel) {
			const cultureValues = {};
			const primaryCulture = Terrasoft.SysValue.PRIMARY_CULTURE.displayValue;
			const currentUserCulture = Terrasoft.SysValue.CURRENT_USER_CULTURE.displayValue;
			localizableStringModel.forEach(function (model) {
				cultureValues[model.cultureName] = model.value;
			}, this);
			if (!cultureValues[primaryCulture]) {
				if (cultureValues[currentUserCulture]) {
					cultureValues[primaryCulture] = cultureValues[currentUserCulture];
				} else {
					cultureValues[primaryCulture] = this._getSomeNotEmptyCultureValue(cultureValues);
				}
			}
			return cultureValues;
		},

		/**
		 * @private
		 */
		_getSomeNotEmptyCultureValue: function(cultureValues) {
			return Object.values(cultureValues).find(function(cultureValue) {
				return !Ext.isEmpty(cultureValue);
			});
		},

		/**
		 * @private
		 */
		_updateColumn: function(column, data) {
			column.setPropertyValue("name", data.name);
			column.setPropertyValue("dataValueType", data.format);
			column.setPropertyValue("isRequired", data.isRequired);
			column.setPropertyValue("isValueCloneable", data.isValueCloneable);
			const caption = new Terrasoft.LocalizableString({
				cultureValues: this._getCultureValues(data.caption)
			});
			column.setPropertyValue("caption", caption);
			column.fireEvent("changed", {}, this);
		},

		/**
		 * @private
		 */
		_supportIsRequiredOnPage: function(viewModel) {
			const designer = viewModel.designSchema;
			return designer.$SupportParametersDataModel;
		},

		/**
		 * @private
		 */
		_toLocalizableStringModel: function (localizableString) {
			const cultureValues = localizableString && localizableString.cultureValues || {};
			return Object.entries(cultureValues).map(function(cultureValue) {
				return {
					cultureName: cultureValue[0],
					value: cultureValue[1]
				};
			});
		},

		/**
		 * @private
		 */
		_getDataValueType: function(column) {
			let type;
			switch (column.dataValueType) {
				case Terrasoft.DataValueType.TEXT:
					type = Terrasoft.DataValueType.MEDIUM_TEXT;
					break;
				case Terrasoft.DataValueType.FLOAT:
					type = Terrasoft.DataValueType.FLOAT2;
					break;
				default:
					type = column.dataValueType;
			}
			return type;
		},

		// endregion

		//region Methods: Protected

		/**
		 * Return a type of editable page item.
		 * @protected
		 * @return {String} Page item type.
		 */
		getPageItemType: function() {
			return "entityColumn";
		},

		/**
		 * Returned column config.
		 * @param {Terrasoft.model.BaseViewModel} viewModel View model
		 * @protected
		 * @return {Object} Column config.
		 */
		getColumnConfig: function(viewModel) {
			const itemConfig = viewModel.itemConfig;
			const labelConfig = itemConfig.labelConfig;
			const validationColumnConfig = this._getValidationColumnConfig(viewModel);
			const status = viewModel.column.getStatus();
			const captionLabel = labelConfig && labelConfig.captionLocalizableValue;
			const column = viewModel.column;
			return Object.assign({}, Ext.decode(column.serialize()), {
				caption: this._toLocalizableStringModel(column.caption),
				captionLabel: this._toLocalizableStringModel(captionLabel),
				hideCaption: labelConfig && labelConfig.visible === false,
				readOnly: itemConfig.enabled === false,
				validationConfig: validationColumnConfig,
				isNew: status === Terrasoft.ModificationStatus.NEW,
				isInherited: viewModel.column.isInherited,
				itemType: this.getPageItemType(),
				isRequiredOnPage: itemConfig.isRequired,
				supportIsRequiredOnPage: this._supportIsRequiredOnPage(viewModel),
				dataValueType: this._getDataValueType(column),
				isMultilineText: itemConfig.contentType === Terrasoft.ContentType.LONG_TEXT
			});
		},

		/**
		 * Initializes resources
		 * @param {Object} schemaResources Resources
		 * @protected
		 */
		initResources: function(schemaResources) {
			Ext.applyIf(this.resources.localizableImages, schemaResources.localizableImages);
			Ext.applyIf(this.resources.localizableStrings, schemaResources.localizableStrings);
		},

		/**
		 * Initializes translation
		 * @protected
		 */
		initPageDesignerTranslation: function() {
			const translation = this.getPropertiesPageTranslation();
			this.mixins.customEvent.publish("GetPageWizardTranslation", translation);
		},


		/**
		 * Returned page translations
		 * @protected
		 */
		getPropertiesPageTranslation: function() {
			const caption = this._getColumnCaption();
			return {
				"captionLabel": baseSectionMainSettingsResources.localizableStrings.CaptionLabel,
				"nameLabel": baseSectionMainSettingsResources.localizableStrings.CodeLabel,
				"captionLabelLabel": this.resources.localizableStrings.LabelCaption,
				"isRequiredLabel": this.resources.localizableStrings.IsRequired,
				"isRequiredOnPageLabel": resources.localizableStrings.IsRequiredOnPageLabel,
				"readOnlyLabel": this.resources.localizableStrings.ReadOnly,
				"isMultilineTextLabel": this.resources.localizableStrings.isMultilineTextLabel,
				"hideCaptionLabel": this.resources.localizableStrings.HideTitle,
				"isValueCloneableLabel": this.resources.localizableStrings.MakeCopy,
				"caption": caption,
				"saveButton": this.resources.localizableStrings.SaveButtonCaption,
				"cancelButton": this.resources.localizableStrings.CancelButtonCaption,
				"wrongColumnName": this.resources.localizableStrings.WrongColumnNameMessage,
				"wrongPrefix": this.resources.localizableStrings.WrongPrefixMessage,
				"duplicateColumnName": this.resources.localizableStrings.DuplicateColumnNameMessage,
				"columnEmpty": Terrasoft.Resources.BaseViewModel.columnRequiredValidationMessage,
				"wrongCaptionLength": baseSchemaViewModelResources.localizableStrings.WrongCaptionLengthMessage,
				"columnFormat": pageDesignerUtilitiesResources.localizableStrings.DateTypeCaption,
				"columnTextFormat": pageDesignerUtilitiesResources.localizableStrings.TextDateTypeCaption,
				"columnNumberFormat": pageDesignerUtilitiesResources.localizableStrings.NumberDataTypeCaption,
				"Date": Terrasoft.data.constants.DataValueTypeConfig.DATE.displayValue,
				"DateTime": Terrasoft.data.constants.DataValueTypeConfig.DATE_TIME.displayValue,
				"Time": Terrasoft.data.constants.DataValueTypeConfig.TIME.displayValue,
				"ShortText": Terrasoft.data.constants.DataValueTypeConfig.SHORT_TEXT.displayValue,
				"MediumText": Terrasoft.data.constants.DataValueTypeConfig.MEDIUM_TEXT.displayValue,
				"LongText": Terrasoft.data.constants.DataValueTypeConfig.LONG_TEXT.displayValue,
				"MaxSizeText": Terrasoft.data.constants.DataValueTypeConfig.MAXSIZE_TEXT.displayValue,
				"Integer": Terrasoft.data.constants.DataValueTypeConfig.INTEGER.displayValue,
				"FLOAT1": Terrasoft.data.constants.DataValueTypeConfig.FLOAT1.displayValue,
				"FLOAT2": Terrasoft.data.constants.DataValueTypeConfig.FLOAT2.displayValue,
				"FLOAT3": Terrasoft.data.constants.DataValueTypeConfig.FLOAT3.displayValue,
				"FLOAT4": Terrasoft.data.constants.DataValueTypeConfig.FLOAT4.displayValue,
				"FLOAT8": Terrasoft.data.constants.DataValueTypeConfig.FLOAT8.displayValue,
				"generalCaption": this.resources.localizableStrings.GeneralCaption,
				"editabilityCaption": this.resources.localizableStrings.EditabilityCaption,
				"appearenceCaption": this.resources.localizableStrings.AppearenceCaption,
				"advancedCaption": this.resources.localizableStrings.AdvancedCaption,
				"changeTypeMessage": this.resources.localizableStrings.ChangeTypeMessage,
				"undoButtonCaption": this.resources.localizableStrings.UndoButtonCaption,
				"LocalizableStringsDialog.Cancel": this.resources.localizableStrings.CancelButtonCaption,
				"LocalizableStringsDialog.Apply": this.resources.localizableStrings.ApplyButtonCaption,
				"LocalizableStringsDialog.ShowAllLanguages": this.resources.localizableStrings.ShowAllLanguages,
				"LocalizableStringsDialog.HideInactiveLanguages": this.resources.localizableStrings.HideInactiveLanguages
			};
		},

		// endregion

		//region Methods: Public

		/**
		 * @inheritdoc Terrasoft.BaseObject#constructor
		 * @override
		 */
		constructor: function() {
			this.callParent(arguments);
			this.resources = {
				localizableImages: {},
				localizableStrings: {}
			};
		},

		/**
		 * @override
		 */
		init: function() {
			this.initResources(resources);
			this.initResources(entitySchemaColumnDesignerResources);
			this.initResources(baseDesignerResources);
			this.callParent(arguments);
			this._initCustomEvents();
			this.initPageDesignerTranslation();
		},

		/**
		 * @override
		 */
		render: function(renderTo) {
			this.callParent(arguments);
			const propertiesPage = document.createElement("ts-page-item-properties-page-host");
			propertiesPage.setAttribute("item-type", this.getPageItemType());
			propertiesPage.setAttribute("current-culture",
				Terrasoft.SysValue.CURRENT_USER_CULTURE.displayValue);
			renderTo.appendChild(propertiesPage);
			MaskHelper.hideBodyMask();
		},

		/**
		 * @override
		 */
		onDestroy: function() {
			this.mixins.customEvent.destroy();
			this.callParent(arguments);
		}

		// endregion

	});
	return Terrasoft.EntityColumnPropertiesPageModule;
});
