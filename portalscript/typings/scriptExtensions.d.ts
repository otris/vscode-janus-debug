declare interface ListAction {
    /**
     * Unique name of the action
     */
    name: string;
    /**
     * Label to display for this action
     */
    label: string;
    /**
     * Type of the action ("button" or "list") default: "button"
     */
    type: string;
    /**
     * Action to be executed, e.g., ("runScript:myScript&myParam=value")
     */
    action: string;
    /**
     * The action is displayed with the referenced icon (`entypo:` or `ionicons:` syntax is supported). **Only for type `button`**
     */
    imageFile?: string;
    /**
     * Optional tooltip
     */
    tooltip?: string;
    /**
     * <strong>[ONLY USEABLE IN GADGET CONTEXT]</strong> Register a client function that is called with an array of ids if showCheckboxes is enabled
     */
    clientAction?: string;
    /**
     * <strong>[ONLY USEABLE IN GADGET CONTEXT]</strong> Register a gadget action belonging to the same gadgetScript to be executed on click
     */
    gadgetAction?: string;
}

/**
 * the value from the enum array with the given index.
 * Or an Array of key value pairs i.e. [[0, "A"], [1, "B"]]. The values must be of the type defined in <i>type</i>.
 */
declare interface GadgetSetting {
    /**
     * The techincal name of the setting
     */
    name: String;
    /**
     * The default value to be used if no value is specified. If a number is specified the default value will be the value from the enum array with the given index.
     */
    def: String | Number;
    /**
     * The type of the setting. (string | boolean | number)
     */
    type: String;
    /**
     * An Array of values i.e. ["A", "B"] that the user can choose from. Or an Array of key value pairs i.e. [[0, "A"], [1, "B"]]. The values must be of the type defined in <i>type</i>.
     */
    enum: any;
    /**
     * The description of this setting
     */
    desc?: String;
}

declare namespace otris {
    namespace scriptlist {
        /**
         * This class represents a generic List that can be displayed and used inDOCUMENTS 5 and above. It can be used as the return value of a PortalScript andwill be usually displayed in the main ListView.To implement the various list functions, the following **script parameters** are available.Some of the parameters are not always set since they are only transferred when a value change occurs.```var scriptListParams = {    start : (typeof start != "undefined") ? parseInt(start) : 0,    limit: (typeof limit != "undefined") ? parseInt(limit) : 50,    sort: (typeof sort != "undefined") ? sort : null,    sortState: (typeof sortState != "undefined") ? sortState : null,    searchExpression: (typeof searchExpression != "undefined") ? searchExpression : null,    sortExpression: (typeof sortExpression != "undefined") ? sortExpression : null,    sortOrder: (typeof sortOrder != "undefined") ? sortOrder : null,    sortMode: (typeof sortMode != "undefined") ? sortMode : null};```
         */
        class List {
            /**
             * @param title - The title of the list that will be displayed in the lists toolbar
             */
            constructor(title: string);

            /**
             * Adds a new action to the list.
             * @param action - List action to be addded to the list.
             */
            addAction(action: ListAction): void;

            /**
             * Add a column to the list
             * @param key - the technical name of the column
             * @param label - the human readable label of the column
             * @param dataType - the type of the column (STRING, NUMBER, CUSTOM or CHECKBOX)
             */
            addColumn(key: string | Object, label: string, dataType: string): Object;

            /**
             * Set the title of the list.
             * @param title - list title
             */
            setTitle(title: string): void;

            /**
             * Set list to display groupings collapsed.
             * @param collapsed - true, if the list is collapsed
             */
            setCollapsed(collapsed: boolean): void;

            /**
             * Set the height for the current grid (only applicable for subgrids)
             * @param height - Height of the details row
             */
            setHeight(height: number): void;

            /**
             * Set the columns. Removes any columns that have been added before.
             * @param columnArray - Array of column configurations
             */
            setColumns(columnArray: otris.scriptlist.Column[]): void;

            /**
             * Set the groupings for the list.
             * @param groupings - Array of names and/or objects of columns to group by. Object notation:  { column_id: string, collapsed: boolean }
             */
            setGrouping(groupings: (string|Object)[]): void;

            /**
             * Set sorting for the list
             * @param sort - True for sortable with default remote sort, Object: { sortable: boolean, remoteSort: boolean}
             */
            setSort(sort: boolean | Object): void;

            /**
             * Set template for rendering group header HTML
             * @param groupHeaderTemplate - Template string to use (e.g. `<div style="padding-left:calc({{index}}*15px)"><span class="otrIcon"></span><b>{{value}}</b></div>`)
             */
            setGroupHeaderTemplate(groupHeaderTemplate: string): void;

            /**
             * Enable a checkbox inside the group header
             * @param showGroupCheckbox - Enables the group checkbox if true.
             */
            setShowGroupCheckbox(showGroupCheckbox: boolean): void;

            /**
             * Add a parameter that will be send to the script when the next page is beeing
             * retrieved (infinite scrolling)
             * @param key - Name of the parameter
             * @param value - Value of the parameter
             */
            addParameter(key: string, value: any): void;

            /**
             * Set the start index of the list. The index of the first entry in this list object
             * in relation to the total number of entries in the list.
             * @param startIndex - Index of the first entry
             */
            setStartIndex(startIndex: number): void;

            /**
             * Set whether or not the details row of the entries should be expanded automatically
             * when an entry is clicked.
             * @param autoShow - Show detail rows automatically
             */
            setAutoShowDetails(autoShow: boolean): void;

            /**
             * Set whether or not to display a column containing a + sign for each entry that can be
             * sed to expand the entry and show some details inside the table.
             * @param showDetailsColumn - Show the plus sign
             */
            setShowDetailsColumn(showDetailsColumn: boolean): void;

            /**
             * Set whether or not to display a checkboxes for each column for multi selection
             * @param showCheckboxes - Show checkboxes
             */
            setShowCheckboxes(showCheckboxes: boolean): void;

            /**
             * Set whether or not to display a search box in the toolbar
             * @param showSearchBox - True for searchbox with default remote search. Object: { remoteSearch: boolean }
             */
            setShowSearchBox(showSearchBox: boolean | Object): void;

            /**
             * Sets the name of the search context (displayed in the searchbar). If this value is not set,
             * the list is not searchable.
             * If no name was set for the searchContext, the list's name will be used. (Default: false)
             * @param searchContext - The search context name with default remote search. Object: { name: string, remoteSearch: boolean }
             */
            setSearchContext(searchContext: string | Object): void;

            /**
             * Set the name of the script that will be called when a details row is expanded.
             * Allowed returnTypes for the script are: "HTML" and "ScriptList"
             * @param detailsScriptName - The scriptName
             */
            setDetailsScriptName(detailsScriptName: string): void;

            /**
             * Set the parameters that should be send to the details script when expanding a details row
             * @param detailsParams - object of the parameters to pass to the script
             */
            setDetailsParams(detailsParams: Object): void;

            /**
             * Mark this list object to contain the last entries of the total list. Using this function means
             * "the entries contained in this list are the last ones in the overall list"
             */
            endList(): void;

            /**
             * Add a row to the list
             * @param key - The UNIQUE key of the row. (Can be a fileId or any other unique id)
             * @param values - An array containing the values of this row in the order of which the columns has been added to the list OR an object mapping the column keys to the columns values.
             */
            addRow(key: string, values: any | Object): otris.scriptlist.Row;

            /**
             * Adds a setting (an option that can be defined by the user) to the gadget.
             * @param option - Setting(s) to add to the gadget.
             */
            addSettings(option: GadgetSetting | GadgetSetting[]): void;

            /**
             * Sets whether or not the columns should take up the entire available space of the table automatically
             * @param autoWidth - true for the columns to take up the full width of the table
             */
            setAutoColumnWidth(autoWidth: boolean): void;

            /**
             * Set the compact view setting for the list
             * @param compactView - true for default compact view or a String as a template for the compact view
             * @param lineHeight - line height of the compact view line
             */
            setCompactView(compactView: boolean | string, lineHeight: number): void;

            /**
             * Set the maximum with that the compact view will be used for (the point where the view is switched from full view to compact view)
             * @param width - the with where to switch at
             */
            setCompactViewWidth(width: number): void;

            /**
             * Sets whether or not the compactView should always be displayed, even is the table is wide enough to display the normal table view
             * @param forceCompactView - force compact view?
             */
            setForceCompactView(forceCompactView: boolean): void;

            /**
             * Adds a listener to the ScriptList. If a registered event occurs the ScriptList script is called.
             * With [getScriptListEvent]{@link otris.scriptlist.List#getScriptListEvent} you can check if the script was triggered by an event.
             * Currently the following **events** are supported:
             * * `reloadRow`
             * Listen to file updates. Example for the `scriptListEvent`: `{name: "reloadRow", ids: ["dopaag_fi110", "dopaag_fi111", "dopaag_fi112"]}`
             * In your script you have to check if the given ids are part of your list and/or if the referenced files matches your search criterias.
             * As **return value** a ScriptList containing only the updated rows is expected. (If you would like to delete rows do not return the row data)
             * @param eventName - event name (currently supported: "reloadRow")
             */
            addListener(eventName: string): void;

            /**
             * Returns the ScriptList event. See [addListener]{@link otris.scriptlist.List#addListener} for details.
             * **Notice:** Returns `undefined` if the script was not triggered by an event.
             */
            getScriptListEvent(): Object | undefined;

            /**
             * Adds a html header to the table which is displayed above the table.
             * @param htmlheader - the html to display
             */
            setHTMLHeader(htmlheader: string): void;

            /**
             * Show or hide the lists toolbar
             * @param showToolbar - show the toolbar?
             */
            setShowToolbar(showToolbar: boolean): void;

            /**
             * Show or hide the list header (column labels)
             * @param showToolbar - show the list header (column labels)
             */
            setShowHeader(showToolbar: boolean): void;

            /**
             * Return a proper JSON representation of this list.
             */
            transfer(): string;

        }

        /**
         * This class represents a Row used in a {@link otris.scriptlist.List}.You do not need to instantiate objects of this class directly. Instances ofthis class are returned from the [addRow]{@link otris.scriptlist.List#addRow}method of the List object.
         */
        class Row {
            /**
             * You do not need to instantiate objects of this class directly. Instances of
             * this class are returned from the [addRow]{@link otris.scriptlist.List#addRow}
             * method of the List object.
             */
            constructor();

            /**
             * Tag the row with a predefined grey marker or insert custom html
             * @param tag - True for a standard grey marker, String for Html
             */
            setTag(tag: boolean | string): void;

            /**
             * Set the tag color
             * @param tagColor - Html color for the row's tag
             */
            setTagColor(tagColor: string): void;

            /**
             * Set the row specific name of the script that is called when the rows details row will be expanded.
             * (Overwrites the scriptName set in the list).
             * @param detailsScriptName - the scriptname to use for displaying the details row
             */
            setDetailsScriptName(detailsScriptName: string): void;

            /**
             * Set the row specific parameters that should be send to the details script when expanding
             * the details row. Overwrites the parameters set in the list.
             * @param detailsParams - key/value object of parameters to pass to the details script
             */
            setDetailsParams(detailsParams: Object): void;

            /**
             * Action which will be fired when the row is clicked.
             * Available actions: showFile, showFolder, runScript
             * @param newAction - function to be executed on mouse click
             */
            setAction(newAction: string): void;

            /**
             * Set handler for click event.
             * @param newOnclick - function as string to be executed on mouse click
             */
            setOnClick(newOnclick: String): void;

            /**
             * Checks the row on display
             * @param selected - True if row should be selected in view
             */
            setSelected(selected: Boolean): void;

            /**
             * Transfer function returning the data of the Row for a gadget.
             */
            transfer(): Object;

        }

        /**
         * This class represents a Column used in a {@link otris.scriptlist.List}.You do not need to instatiate objects of this class directly. Instances of thisclass are returned from the [addColumn]{@link otris.scriptlist.List#addColumn}method of the List object.
         */
        class Column {
            /**
             * @param key - Id for the column
             * @param label - Header label of the column
             * @param dataType - Data type of the data in this column
             */
            constructor(key: Object, label: string, dataType: Object);

            /**
             * Flag, if column is visible
             */
            visible: any;

            /**
             * Set the key (the technical name) of this column
             * @param key - the new key
             */
            setKey(key: string): void;

            /**
             * Set the width(in pixels) of this column
             * @param width - width of the column
             */
            setWidth(width: Number): void;

            /**
             * Set the label of the column
             * @param label - the new label
             */
            setLabel(label: string): void;

            /**
             * Set the data type of the column.
             * @param dataType - the new data type (STRING, NUMBER, CUSTOM or CHECKBOX)
             */
            setDataType(dataType: DataType): void;

            /**
             * Sets the sort order.
             * @param sortOrder - Possible values: 0, 1 (ascending), -1 (descending) (Use: 2,-2 / 3,-3 / ... for multi column sort)
             */
            setSortOrder(sortOrder: string): void;

            /**
             * Sets wether or not the column should be visible.
             * Useful when you need columns to group by or columns containing a unique id that
             * should not be displayed in the grid.
             * @param visible - true, if the column should be visible
             */
            setVisible(visible: boolean): void;

            /**
             * Transfer function returning the data of the Column for a gadget.
             */
            transfer(): Object;

        }

    }

    /**
     * PortalScript to create the data for the ScriptTree. This script needs to beincluded in any other PortalScript which builds a ScriptTree. The returnType of thescript where this API is used must be `context.returnType = "scriptTree";`
     */
    class TreeItem {
        /**
         * @param id - Unique id of the item in the tree
         * @param name - Name of this node
         */
        constructor(id: string, name: string);

        /**
         * Unique id of the node in the tree
         */
        id: any;

        /**
         * Name of the tree node
         */
        name: any;

        /**
         * Parent of this child, or null if it is the root node
         */
        parent: any;

        /**
         * Selection of this node true or false
         */
        isActive: any;

        /**
         * URL which will be opend if the node is clicked
         */
        url: any;

        /**
         * <strong>DEPRECATED!</strong> Do not use this attribute!
         */
        bullet: any;

        /**
         * Sets the opened tree level.
         */
        openTreeLevel: any;

        /**
         * Adds an icon to the tree item. Possible values: **image path**, **entypo icon** or **ionicons icon**
         */
        activebullet: any;

        /**
         * If set to true the outbar label is updated with the defined tree title (Only relevant for the root node)
         */
        updateOutbarLabel: any;

        /**
         * Specifies if the tree item is draggable (defaults to `true`)
         */
        draggable: any;

        /**
         * List of nodes
         */
        items: any;

        /**
         * Action which will be fired when the node is clicked.
         * Possible actions `showFile:[FILE_ID]`, `showFolder:[FOLDER_ID]` and `executeScript:[SCRIPTNAME]`
         */
        action: any;

        /**
         * Drop action which will be fired when something will be dropped to this node.
         * The defined script is executed before a file is uploaded. The script should return
         * a fileId of a document. script returnType = (showFile|showNewFile)
         */
        dropaction: any;

        /**
         * Drop action which will be fired when something will be dropped to this node.
         * The script is only executed if items from within documents are dropped on the node
         * The script is called with the following json encoded parameter object (parameter name: `dndActionJSON`):
         * <pre>dndAction = {
         * treeType  string  "scriptTree"
         * nodeId    string  id of the drop target
         * action    string  "copy"/"move"
         * itemIds   array   ids of the dropped items
         * itemType  string  type of the items
         * }</pre>
         * Decode the parameter object in the script: <pre>var dndAction = JSON.parse(dndActionJSON);</pre>
         */
        docItemsDropAction: any;

        /**
         * The tree item drop action will be fired when one or more tree items are dropped on a tree node.
         * The script is called with the following json encoded parameter object (parameter name: `dndActionJSON`):
         * **This property is only relevant for the root node**
         * <pre>dndAction = {
         * nodeId    string  id of the drop target
         * itemIds   array   ids of the dropped nodes
         * action    string  "copy"/"move"
         * }</pre>
         * Decode the parameter object in the script: <pre>var dndAction = JSON.parse(dndActionJSON);</pre>
         */
        treeItemsDropAction: any;

        /**
         * Sets the type for this tree item (defaults to: `node`)
         * Only accepts the following characters for the given string: `a-z`,`0-9`,`-` and `_`
         * Non valid strings are automatically transformed (characters are transformed to lower case or replaced with `_`)
         * @param type - The type for this tree item
         */
        setType(type: string): void;

        /**
         * Sets the accepted types (e.g. for drag and drop) for this tree item (defaults to: `["node"]`)
         * See [setType]{@link otris.TreeItem#setType} for valid type strings
         * @param types - An array of accepted types
         */
        setAcceptedTypes(types: string[]): void;

        /**
         * Add a new node as a childnode to this node.
         * This node will be the parent of the added node.
         */
        addItem(): void;

        /**
         * Set the level up to which the tree will be opened.
         * @param level Level up wich the tree will be opened
         */
        setOpenTreeLevel(level: Number): void;

        /**
         * Make this object ready for being transferred to the client.
         */
        transfer(): void;

        /**
         * Internal function for building the ScriptTree XML.
         * @param myLevel - Current level in the tree
         */
        getAll(myLevel: number): string;

        /**
         * Internal function returning the attributes of this class as ScriptTree XML.
         */
        getAsXML(): string;

        /**
         * Converts the string to a valid XML string. For internal purposes only.
         * @param value - value to convert
         */
        convertToXMLString(value: string): string;

    }

    namespace treechart {
        /**
         * Style definition for a {@link otris.treechart.TreeNode}.
         */
        interface Skin {
            /**
             * code for node color
             */
            Color: string;
            /**
             * Color code for the border of a node
             */
            borderColor: string;
            /**
             * Name of the font for the node's label
             */
            font: string;
            /**
             * Color code for the node's label
             */
            fontColor: string;
            /**
             * Font size for the node's label
             */
            fontSize: number;
            /**
             * Radius if the corner should be rounded
             */
            borderRoundness: number;
            /**
             * Vertical margin of the label to the node's border
             */
            vMargin: number;
            /**
             * Horizontal margin of the label to the node's border
             */
            hMargin: number;
            /**
             * Code how leafs should be rendered
             */
            leafRendering: string;
            /**
             * Color code for highlighted node
             */
            highlightColorIn: string;
            /**
             * Color code for de-highlighting a node
             */
            highlightColorOut: string;
        }

        /**
         * Script command for executing an action. The following commands are available:
         * showFile:fileId, runScript:scriptName (return needs to be a TreeChart), showFolder:folderId
         */
        interface ActionScript {
        }

        /**
         * Event handlers on a {@link otris.treechart.TreeNode}.
         */
        interface EventHandlers {
            /**
             * Action for handling the click event
             */
            click: otris.treechart.ActionScript;
            /**
             * Action for handling the double click event
             */
            dblClick: otris.treechart.ActionScript;
            /**
             * Action for handling the right click event
             */
            rightClick: otris.treechart.ActionScript;
        }

        /**
         * Label of an edge between two {@link otris.treechart.TreeNode}.
         */
        interface EdgeLabel {
            /**
             * Labe of the edge
             */
            label: string;
        }

        /**
         * Specifies the edge between two {@link otris.treechart.TreeNode}. nodeId is the id
         * of the child {@link otris.treechart.TreeNode}. For every child there has to be
         * a corresponding property having the same name as the id of the child node.
         */
        interface Edge {
            /**
             * Label of the edge
             */
            nodeId: otris.treechart.EdgeLabel;
        }

        /**
         * Code for the orientation of the tree. Allowed values are "LR" (left to right) and "TB" (top to bottom)
         */
        interface Orientation {
        }

        /**
         * Class for gathering the data needed for the Dynamic Tree Chart.
         */
        class TreeChart {
            constructor();

            /**
             * Transfer function generating the data for the Dynamic Tree Chart.
             */
            transfer(): string;

            /**
             * Creates a tree node. This method is provided for convenience.
             * Tree nodes can be also created via the constructor of {@link otris.treechart.TreeNode}.
             * @param id - Id of the new node
             * @param label - Label of the node
             */
            createNode(id: string, label: string): otris.treechart.TreeNode;

            /**
             * Creates a tree node and initialize it as a leaf. This method is provided for convenience.
             * Tree nodes can be also created via the constructor of {@link otris.treechart.TreeNode}.
             * @param id - Id of the new node
             * @param label - Label of the node
             */
            createLeaf(id: string, label: string): otris.treechart.TreeNode;

            /**
             * Sets the root node of the tree.
             * @param node - Root node of the tree
             */
            setRoot(node: otris.treechart.TreeNode): void;

        }

        /**
         * Represents a node for the {@link TreeChart}
         */
        class TreeNode {
            /**
             * @param id - Id of the node
             */
            constructor(id: string);

            /**
             * Adds another node as child to the node.
             * @param child - Node to add as a child
             */
            addChild(child: otris.treechart.TreeNode): void;

            /**
             * Convenience method to retrieve the event handlers of the node.
             * Possible actions:
             * &emsp;&emsp;showFile:fileId[?dlcRegisterId=registerId&dlcDocumentId=documentId]
             * &emsp;&emsp;showFolder:folderId
             * &emsp;&emsp;runScript:scriptName
             */
            getActionEvents(): otris.treechart.EventHandlers;

            /**
             * Checks, if a node is a child of this node.
             * @param node - Node to be checked
             */
            isChild(node: otris.treechart.TreeNode): boolean;

            /**
             * Convenience method for setting the label of an edge to a child node.
             * @param child - Child node which edge should be labeled. If the node is not a child, it becomes a child
             * @param label - Label of the edge to the child node
             */
            setEdgeLabel(child: otris.treechart.TreeNode, label: string): void;

        }

        /**
         * Style specification for a {@link TreeNode}. This class can be usedlike a style template. By applying the same NodeStyle on various nodes makesthe nodes look the same.
         */
        class NodeStyle {
            /**
             * @param fillColor - Color code for the fill color of the node
             * @param borderColor -Color code for the border of the node
             * @param font - Name of the font
             * @param fontColor - Color code for the
             * @param fontSize - Font size of the node text
             * @param borderRoundness - Sharpness of the node corner
             * @param vMargin - Vertical margin of the node
             * @param hMargin - Horizontal margin of the node
             */
            constructor(fillColor: string, borderColor: string, font: string, fontColor: string, fontSize: string, borderRoundness: number, vMargin: number, hMargin: number);

            /**
             * Set a NodeStyle property.
             * * **fillColor** (string) Color code for the fill color of the node
             * * **borderColor** (string) Color code for the border of the node
             * * **font** (string) Name of the font
             * * **fontColor** (string) Color code for the
             * * **fontSize** (string) Font size of the node text
             * * **fontStyle** (string) Specifies the font style for the node text. Possible values: normal, italic, oblique, initial, inherit
             * * **borderRoundness** (number) Sharpness of the node corner
             * * **vMargin** (number) Vertical margin of the node
             * * **hMargin** (number) Horizontal margin of the node
             * @param propertyName - property name
             * @param propertyValue - property value
             */
            setProperty(propertyName: string, propertyValue: string | number): void;

            /**
             * Applies the style specification on a node.
             * @param node - The node the style should applied on
             */
            applyOn(node: otris.treechart.TreeNode): otris.treechart.TreeNode;

        }

    }

}

/**
 * Enum string values.
 */
declare enum DataType {
    STRING = "STRING",
    NUMBER = "NUMBER",
    CUSTOM = "CUSTOM",
    CHECKBOX = "CHECKBOX",
}

