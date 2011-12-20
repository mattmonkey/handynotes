Components.utils.import("resource://note/cache.js");

window.NOTEAction = (function(){	

	function LOG(msg) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage(msg);
	}
		
	function ce(name,node,data,handles,insertflg){
		var object = document.createElement(name);
		for(var p in data){
			object.setAttribute(p,data[p])
		}
		for(var p in handles){
			object.addEventListener(p,handles[p],false)
		}
		if (typeof node === 'string') {
			node = document.getElementById(node)
		}
		if(!insertflg){
			if(node) node.appendChild(object)			
		}else{
			if(node) node.insertBefore(object,node.firstChild)
		}
		return object
	}
	
	function $(arg){
		if(typeof arg =='string') return document.getElementById(arg);
		return arg
	}
	
NOTEHelper = {
	Cc:Components.classes,
	Ci:Components.interfaces,
	fp : Components.classes["@mozilla.org/filepicker;1"].getService(Components.interfaces.nsIFilePicker),
			
	saveFile:function(data){
		var fp = this.createInterface("@mozilla.org/filepicker;1","nsIFilePicker");
		fp.init(window, this.getStringbundle('saveexporttextfile'),fp.modeSave)
		fp.defaultExtension  = 'txt';	
		fp.appendFilters(fp.filterText);
		var rv = fp.show()
		if (rv == fp.returnOK || rv == fp.returnReplace) {
			this.writeFile(fp.file,data)
			alert(NOTEHelper.getStringbundle('savenotice'));
		}
	},
	
	writeFile:function(file,data){
		var foStream = this.createInterface("@mozilla.org/network/file-output-stream;1","nsIFileOutputStream");
		foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
		var converter =  this.createInterface("@mozilla.org/intl/converter-output-stream;1","nsIConverterOutputStream");
		converter.init(foStream, "UTF-8", 0, 0);
		converter.writeString(data);
		converter.close();
	},
	
	readFile:function(file){
		var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
		                        createInstance(Components.interfaces.nsIFileInputStream);
		var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
		                        createInstance(Components.interfaces.nsIConverterInputStream);
		fstream.init(file, -1, 0, 0);
		cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish
		
		var str ={}
		cstream.readString(-1, str); // read the whole file and put it in str.value
		cstream.close();
		return str.value
	},
	
	confirm:function(title,flg){
		var processflg = true;
		if(flg){
		   processflg = confirm(title)
		}
		return processflg;
	},
	
	getService:function(c,s){
		return this.Cc[c].getService(this.Ci[s]);
	},
	
	createInterface:function(c,i){
		 return this.Cc[c].createInstance(this.Ci[i]);
	},
	
	getStringbundle:function(item,args){
		var bundle =  document.getElementById('note-stringbundle');
		if(args){
			return bundle.getFormattedString("note."+item, args);
		}
		return bundle.getString("note."+item)
	},
	
	// 笔记边框样式
	getBorderStyle:function(){
		var style = "border:1px";
		style += ";border-top-color:"+NOTEHelper.borderTopColor;
		style += ";border-left-color:"+NOTEHelper.borderColor;
		style += ";border-bottom-color:"+NOTEHelper.borderColor;
		style += ";border-right-color:"+NOTEHelper.borderColor
		style += ";border-style:solid;";
		return  style;
	},
	
	// 笔记样式（底色、字体大小）
	getTextBoxStyle:function(){
		var style = 'background-color:'+NOTEHelper.backgroundColor
		style += ";font-size:"+NOTEHelper.fontSize+"pt;"
		return style;
	},
	
	// 选中的笔记样式（底色、字体大小）
	getSelectedTextBoxStyle:function(){
		var style = 'background-color:'+NOTEHelper.selectedBackgroundColor
		style += ";font-size:"+NOTEHelper.fontSize2+"pt;"
		return style;
	},
	
	// 选中笔记的标签栏的样式（底色、斜体）
	getSelectedTagBoxStyle2:function(){
		var style ='background-color:'+NOTEHelper.selectedTagBackgroundColor
		style += ";font-style:italic;"
		return style;
	},
	
	// 选中笔记的标签栏的样式（底色、斜体）
	getSelectedTagBoxStyle:function(){
		var style ='background-color:'+NOTEHelper.selectedBackgroundColor
		style += ";font-style:italic;"
		return style;
	},
	
	// 笔记工具条的样式（底色）
	getTextboxToolbarStyle:function(){
		return 'background-color:'+NOTEHelper.selectedBackgroundColor;
	},
	
	testRule:function(url,rules){
		var r=rules.split(';')
		for(var cnt in r){
			if(r[cnt].trim()!=''){
				if(url.indexOf(r[cnt].trim())==0){
					return true		
				}
			}
		}
		return false	
	}
	
}

	var props=[
	 'tooltipshowcatalog',
	 'openmode',
	 'borderTopColor',
	 'borderColor',
	 'backgroundColor',
	 'selectedBackgroundColor',
	 'selectedTagBackgroundColor',
	 'fontSize',
	 'fontSize2',
	 'noteareaheight',
	 'showtooltip',
	 'deletefirm',
	 'editorstatus',
	 'pageshowingitemnum'
	]
	
	function genSetterGetter(props){
		for (var n in props) {
			var propName = props[n];
			var _fn_getter = function(){
				var p= propName;
				return function(){
				return Application.prefs.getValue('extensions.note.' + p, null)
			}
			}();
			var _fn_setter = function(){
				var p= propName;
				return function(val){
					Application.prefs.setValue('extensions.note.' + p, val)
				}
			}()
			NOTEHelper.__defineGetter__(propName, _fn_getter)
			NOTEHelper.__defineSetter__(propName, _fn_setter)
		}
	}
	
	genSetterGetter(props)


var NOTEAction = {
	// 执行器
	execute : function(actionName,args) {
		var param, param2,param3;
		if ((typeof NOTEAction[actionName]) == 'function') {
			param = NOTEAction[actionName](args);
		} else {
			param = args;
		}
		if ((typeof NOTEDBOpt[actionName]) == 'function') {
			param2 = NOTEDBOpt[actionName](param);
		}else{
			param2 = args;
		}
		if ((typeof NOTEUI[actionName]) == 'function') {
			parsm3 = NOTEUI[actionName](param2);
		}
		if ((typeof NOTEAction.Notificaton[actionName]) == 'function') {
			return NOTEAction.Notificaton[actionName](param2);
		}else{
			return param2
		}
	},

	// 联动、刷新通知
	 Notificaton : {
		notify:function(s,t,d){
			var observerService = Components.classes["@mozilla.org/observer-service;1"]
					.getService(Components.interfaces.nsIObserverService);
			
			observerService.notifyObservers(s, t, d);		
		},
		
		modifyCatalog : function(args) {
			this.notify(null, "note-catalog-change", "modify");
			if(args){
				for(var cnt in args.nids){
					this.notify(null, "note-notifier", args.nids[cnt].nid);				
				}
			}
		},

		appendCatalog : function() {
			this.notify(null, "note-catalog-change", "append");
		},
	
		removeCatalog : function() {
			this.notify(null, "note-catalog-change", "delete");
		},
		
		addNoteFromEditor:function(args){
			this.notify(null, "note-note-change", "add");
			this.notify(null, "note-notifier", args.nid);
		},
		
		deleteNote:function(args){
			this.notify(null, "note-notifier", args);
		},
		
		modifyNoteCatalog:function(arg){
			this.notify(null, "note-notifier", arg.nid);
		},
		
		addNote:function(args){
			this.notify(null, "note-note-change", "add");
			this.notify(null, "note-notifier", args.nid);
		},
		
		appendCatalog2:function(){
			this.notify(null, "note-note-catalog-change", "add");
			this.modifyCatalog()
		},
		
		modifyNote:function(args){
			this.notify(null, "note-notifier", args.nid);
		},
		
		updateLink:function(arg){
			this.notify(null, "note-notifier", arg.nid);				
		},
		
		setNotelabel:function(args){
			if(args)
			this.notify(null, "note-notifier", args);
		},
		updateReadingRule:function(arg){
			this.notify(null, "note-rule-update", "");
			this.notify(null, "note-notifier", arg.nid);
		},
		saveReadingNotes:function(arg){
			this.notify(null, "note-notifier", arg.nid);
		}
	},
	
	init:function(arg){
		if (window && window.arguments) {
			NOTEUI.win = window.arguments[0]
		}
		return NOTEUI.getPageInfo();
	},
	
	addNoteFromEditor:function(){
		var labels = document.getElementById('note-editor-label').value
		var content = document.getElementById('note-editor').value
		var link = document.getElementById('relatedlink-textbox').value
		var cid = '';
		if(document.getElementById('note-editor-menulist').selectedItem){
			cid = document.getElementById('note-editor-menulist').selectedItem.getAttribute('cid')
		}
		return {content:content,cid :cid,oldlabelstring:"",labelstring:labels,link:link}
	},
	
	
	
	initEditorCatalog:function(){
		return window.arguments[0];
	},
	
	// （侧边栏，弹出窗口，工具按钮）保存导出当前笔记内容
	saveNotes : function() {
		return NOTEUI.getPageInfo();
	},
	
	openReadingNotes:function(arg){
		  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			var win = wm.getMostRecentWindow("handynote:readingnotes");
			if (win) {
				win.focus()
			}
			else {
				var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIWebNavigation)
								 .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
								 .rootTreeItem
								 .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIDOMWindow);
				window.openDialog("chrome://note/content/readingnotes/readingnotes.xul", "", ["titlebar", "resizable"],window.content.location.href);
			}
	},
	
	saveReadingNotes:function(id){
		if(id){
			var tb = $(id)
		}else{
			var tb = $("note-"+$('ReadingNotes-tabs').selectedItem.getAttribute('id'));
		}
		var rslt = NOTEAction.execute("checkLastUpdateData",tb.getAttribute('nid'))
		if (tb.value != rslt[0].content) {
			if (tb.getAttribute('lastupdated') != rslt[0].lastupdated) {
				var r = {}
				window.openDialog("chrome://note/content/contentconfirm.xul", "", "chrome, dialog, modal, resizable=yes", rslt[0].content, tb.value, r);
				if (typeof r.content === 'string') {
					tb.value = r.content;
				}
				else {
					tb.value = rslt[0].content;
					tb.setAttribute('lastupdated', rslt[0].lastupdated);
					tb.setAttribute('value', rslt[0].content);
					throw ""
				}
			}
		}else{
			throw ""
		}
		return {nid:tb.getAttribute('nid'),content:tb.value};
	},
	
	initReadingNotes:function(flg){
		if (flg !== true) {
			var handle = new handynote_handleProgress();
			handle.onLocationChange =  function(aProgress, aRequest, aURI){
					//NOTEAction.execute('saveReadingNotes')
					NOTEAction.execute('initReadingNotes', true)
			}
			window.opener.gBrowser.addProgressListener(handle);			
			this.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService); 
		    this.observerService.addObserver({
				observe : function(aSubject, aTopic, aData) {
					//NOTEAction.execute('saveReadingNotes')
					NOTEAction.execute('initReadingNotes', true)
				}
			}, "note-rule-update", false);  
			
		}
		return window.opener.content.location.href;
	},
	
	createRuleAndNotes:function(){
		var title= window.opener.opener.content.document.title;
		var url = $('url').value;
		window.openDialog("chrome://note/content/readingnotes/setreadingrule.xul", "", 
				["modal,dialog,centerscreen,width=600,height=300"],['',title,'',$('rulelist'),'create',url]);
	},
	
	
	openRuleEditor:function(){
		if($('rulelist').selectedItems.length>0){
			var item = $('rulelist').selectedItems[0].firstChild;
			var arg = item.getRuleInfo();
			window.openDialog("chrome://note/content/readingnotes/setreadingrule.xul", "", 
				["modal,dialog,centerscreen,width=600,height=300"],[arg.rule,arg.rulename,arg.nid,item,'edit']);		
		}else{
			alert(NOTEHelper.getStringbundle('selectcheck'))
			throw "";
		};
	},
	
	openSetReadingRule:function(arg){
		window.openDialog("chrome://note/content/readingnotes/setreadingrule.xul", "", 
				["modal,dialog,centerscreen,width=600,height=300"],arg);
	},
	
	openAppendRule:function(){
		window.openDialog("chrome://note/content/readingnotes/appendrule.xul", "", 
				["modal,dialog,centerscreen,width=600,height=300,resizable=yes"]);	
	},
	updateReadingRule:function(){
		var name = $('tb-rulename').value;
		if(!name.trim()){
			alert(NOTEHelper.getStringbundle('namecheck'))
			$('tb-rulename').focus();
			throw ""
		}
		var rule = $('re-rule').getRule();
		if(!rule.trim()){
			if(!confirm(NOTEHelper.getStringbundle('rulempty'))){
				throw ""
			}
		}
		var nid = window.arguments[0][2]
		return {name:name,rule:rule,nid:nid}
	},
	
	appendRule:function(){
		var args = []
		var url = $('url').value;
		for(var cnt in $('rulelist').selectedItems){
			var item = $('rulelist').selectedItems[cnt].firstChild;
			args.push(item.getRuleInfo()) 
		}
		
		if(args.length){
			return [args,url];
		}
		alert(NOTEHelper.getStringbundle('selectcheck'))
		throw ""
	},
	
	initSetReadingRule:function(){
		$('tb-rulename').setAttribute('value',window.arguments[0][1]);
		$('re-rule').rule = window.arguments[0][0];
		$('re-rule').url = window.arguments[0][5];
	},
	
	setNotelabel:function(e){
		var labelstring  = e.target.getAttribute('oldlabels')
		var label  = e.target.value
		var nid = e.target.getAttribute('nid')
		return {nid:nid,labelstring:label,oldlabelstring:labelstring}
	},
	
	
	searchNote : function(e) {
		if (e.keyCode == 13) {
			Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory2).addEntry("note-search-autocomplete", e.target.value);
			NOTEAction.execute('initNote', NOTEUI._genPageInfo((NOTEUI.TYPE==true?'label':'keyword'), e.target.value.trim()))
		}
	},

	deleteNote : function() {
		if (NOTEUI.selectedTextbox ) {
			 if(NOTEHelper.confirm(NOTEHelper.getStringbundle('deletenotice'),NOTEHelper.deletefirm)){
			   return NOTEUI.selectedTextbox.getAttribute('nid');
			}
			throw "note:deleteNote:confirm"
		}
	},
	
	modifyCatalog : function() {
		var aItem = document.getElementById('listbox_note_catalog').currentItem;
		var name = window.prompt("modify catalog", aItem.getAttribute('label'));
		if (name.trim() == "" || name == aItem.getAttribute('label'))
			throw "error";
		var cid = aItem.getAttribute('cid');
		return {
			name : name,
			cid : cid
		}
	},

	appendCatalog : function() {
		var name = prompt(NOTEHelper.getStringbundle('addcatalognotice'));
		if (!name) {
			throw "note:appendCatalog:error";
		}
		return name
	},

	appendCatalog2 : function() {
		return NOTEAction.appendCatalog();
	},
	
	removeCatalog : function() {
		var aItem = document.getElementById('listbox_note_catalog').currentItem;
		var cid = aItem.getAttribute('cid');
		return cid;
	},
	
	openNote:function(arg){
		if(!NOTEHelper.openmode){
			LOG('openNote::showNote~~~~')
			NOTEAction.execute('showNote');			
		}else{	
			if(window.toggleSidebar)  {
				toggleSidebar('viewNoteSidebar')
			} else{
				NOTEUI.win.toggleSidebar('viewNoteSidebar');
			}
			
		}
	},
	
	// (侧边栏，弹出窗口) 翻页
	nextPage:function(flg){
		if (flg) {
			NOTEUI.PAGE += 1;
		} else {
			NOTEUI.PAGE = NOTEUI.PAGE == 1 ? 1 : NOTEUI.PAGE - 1;
		}
		NOTEAction.execute('initNote',{opt:NOTEUI.SEARCHOPT,cond:NOTEUI.COND,page:NOTEUI.PAGE})	
	},
}

var NOTEDBOpt = {
	db_sql_cntcatalog : "SELECT count(ROWID) AS cnt FROM catalog",
	db_sql_cntnote : "SELECT count(ROWID) AS cnt FROM note",
	db_sql_cntlabel : "SELECT count(ROWID) AS cnt FROM label",
	db_sql_cntnotelabel : "SELECT count(ROWID) AS cnt FROM notelabel",
	db_sql_addnote : 'INSERT INTO note (note_id, content,create_date,catalog_id,lastupdate_date,link) VALUES(?1,?2,?3,?4,?5,?6)',
	db_sql_addcatalog : "INSERT INTO catalog (catalog_name) VALUES(?1)",
	db_sql_addlabel : 'INSERT INTO label (label_name) VALUES(?1)',
	db_sql_maxcataid : "SELECT max(ROWID) as cid FROM catalog",
	db_sql_maxlabelid : "SELECT max(ROWID) as lid FROM label",
	db_sql_searchnotebycatalog : "SELECT n.note_id AS nid, "
			+ "c.catalog_id AS cid, "
			+ "c.catalog_name AS catalog, "
			+ "n.content, "
			+ "n.create_date AS created, "
			+ "n.lastupdate_date AS lastupdated, "
			+ "n.rulename AS rulename, "
			+ "n.link AS link, "
			+ "n.rule AS rule "
			+ "FROM note AS n LEFT JOIN catalog AS c on n.catalog_id = c.catalog_id "
			+ "WHERE n.catalog_id = ?1 "
			+ "ORDER BY n.create_date desc ",
	db_sql_searchnotebypage : "SELECT n.note_id AS nid, "
			+ "c.catalog_id AS cid, "
			+ "c.catalog_name AS catalog, "
			+ "n.content ,n.create_date AS created, "
			+ "n.rulename AS rulename, "
			+ "n.link AS link, "
			+ "n.rule AS rule, "
			+ "n.lastupdate_date AS lastupdated "
			+ "FROM note AS n LEFT JOIN catalog AS c on n.catalog_id = c.catalog_id "
			+ "ORDER BY n.create_date desc ",
	db_sql_selectnotebylabel : "SELECT n.note_id AS nid, "
			+ "n.content AS content, "
			+ "c.catalog_id AS cid, "
			+ "c.catalog_name AS catalog, "
			+ "n.rulename AS rulename, "
			+ "n.link AS link, "
			+ "n.rule AS rule, "
			+ "n.lastupdate_date AS lastupdated "
			+ "FROM note AS n LEFT JOIN catalog AS c on c.catalog_id = n.catalog_id, notelabel AS nl, label AS l "
			+ "WHERE n.note_id = nl.note_id AND nl.label_id = l.label_id  and l.label_name = ?1 "
			+ "ORDER BY n.create_date desc ",
	db_sql_selectnotebyword : "SELECT  n.note_id as nid, "
			+ "n.content , "
			+ "c.catalog_id as cid, "
			+ "c.catalog_name AS catalog, "
			+ "n.rulename AS rulename, "
			+ "n.link AS link, "
			+ "n.rule AS rule, "
			+ "n.lastupdate_date AS lastupdated "
			+ "from note AS n left join catalog AS c on n.catalog_id = c.catalog_id "
			+ "where n.content like ?1 "
			+ "ORDER BY n.create_date desc ",
	db_sql_searchcatalog : "SELECT c.catalog_id AS id, "
			+ "c.catalog_name AS name " + "FROM catalog AS c",
	db_sql_selectcatalog :	"SELECT catalog_name AS name,catalog_id AS id FROM catalog WHRER catalog.catalog_name = ?1",
	db_sql_searchnote : "SELECT note.note_id AS nid, note.catalog_id AS cid, note.content FROM note",
	db_sql_searchlabel : "SELECT label.label_id AS id , label.label_name AS name FROM label",
	db_sql_searchlabelandcnt : "SELECT label.label_id,label.label_name AS name,notelabel.note_id ,count(notelabel.note_id) as count "
                                +"FRom label  left join notelabel  on label.label_id = notelabel.label_id  group by label.label_name",
	db_sql_selectlabelbynote : 'SELECT n.note_id AS nid, '
			+ 'l.label_id  AS lid, '
			+ 'l.label_name AS label '
			+ 'FROM note AS n JOIN notelabel AS nl JOIN label AS l  on n.note_id = nl.note_id and nl.label_id = l.label_id '
			+ 'WHERE n.note_id = ?1',
	db_sql_deletenotelabel : "DELETE FROM notelabel where notelabel.note_id = ?1 ",
	db_sql_deletenote : 'DELETE FROM note where note.note_id = ?1',
	db_sql_removenotelabel : 'DELETE FROM notelabel WHERE notelabel.note_id = ?1 and notelabel.label_id =?2 ',
	db_sql_removecatalog : "DELETE FROM catalog WHERE catalog_id = ?1",
	db_sql_delete_catalog : "DELETE FROM catalog",
	db_sql_delete_note : "DELETE FROM note",
	db_sql_delete_label : "DELETE FROM label",
	
	db_sql_searchnotelastupdated : "select lastupdate_date AS lastupdated ,content FROM note where note.note_id=?1",
	
	db_sql_delete_labelbyname : "DELETE FROM label where label.label_name = ?1",
	db_sql_delete_notelabel : "DELETE FROM notelabel",
	db_sql_modifycatalog : "UPDATE catalog SET catalog_name = ?1 WHERE catalog_id = ?2",
	db_sql_modifynote4rule : "UPDATE note SET rulename = ?1,rule = ?2 WHERE note_id = ?3",
	db_sql_modifynote : 'UPDATE note SET content = ?1 , lastupdate_date =?2 WHERE note_id = ?3',
	db_sql_modifynote2 : 'UPDATE note SET catalog_id = ?1  WHERE note_id = ?2',
	db_sql_selectlabel : 'SELECT l.label_id AS id, l.label_name AS name FROM label AS l WHERE name IN (?1)',
	db_sql_searchnotebycatalognum : "SELECT count(n.note_id) as notecnt "
			+ "FROM note AS n LEFT JOIN catalog AS c on n.catalog_id = c.catalog_id "
			+ "WHERE c.catalog_id = ?1",
	db_sql_addnotelabel : 'INSERT INTO notelabel (note_id,label_id) VALUES(?1,?2)',
	db_sql_searchnotelabel:"SELECT nl.note_id as nid ,l.label_name as label FROM notelabel as nl join label as l on nl.label_id = l.label_id  where nl.note_id !=''",
	db_sql_searchrules:"Select rule,rulename,content,note_id As nid,content,lastupdate_date AS lastupdated from note where note.rule!=''",
	db_sql_updatelink : 'UPDATE note SET link = ?1 WHERE note_id = ?2',
	
	
	viewNotebookInfo:function(){
		return this._getDatabaseInfo()
	},

	_getDatabaseInfo:function(conn){
		var rslt = {}
		rslt.catalog = NOTEDB.execute(this.db_sql_cntcatalog,[],['cnt'],conn)[0].cnt
		rslt.note = NOTEDB.execute(this.db_sql_cntnote,[],['cnt'],conn)[0].cnt
		rslt.label = NOTEDB.execute(this.db_sql_cntlabel,[],['cnt'],conn)[0].cnt
		rslt.notelabel = NOTEDB.execute(this.db_sql_cntnotelabel,[],['cnt'],conn)[0].cnt
		return rslt;
	},
	
	getAllCatalog : function() {
		return NOTEDB.execute(this.db_sql_searchcatalog,[],["id","name"]);
	},
		
	getNotelabel:function(nid){
		var oldLabels = NOTEDB.execute(this.db_sql_selectlabelbynote, [nid], ["nid", "lid", "label"]);
		var label=[];
		for(var l in oldLabels){
			label.push(oldLabels[l].label)
		}
		return label.join(',')
	},

    updateReadingRule:function(arg){
		if(!arg.nid){
			var rslt = this.addNullNote()
			arg.nid = rslt.nid
		}
		NOTEDB.execute(this.db_sql_modifynote4rule,[arg.name,arg.rule,arg.nid],[]);
		return arg;
	},
	
	checkLastUpdateData:function(arg){
		var rslt = NOTEDB.execute(this.db_sql_searchnotelastupdated,[arg],['lastupdated','content'])
		return rslt;
	},
	
	initAppendRule:function(){
		return NOTEDB.execute(this.db_sql_searchrules+" order by lastupdate_date DESC",[],['rule','rulename','nid']);
	},
	
	saveReadingNotes:function(data){
		var time = new Date().getTime();
		try {
			NOTEDB.execute(this.db_sql_modifynote, [data.content, parseInt(time), data.nid])
		}catch(e){};
		data.lastupdated=time;
		return data
	},
	
	appendRule:function(args){
		for(var cnt in args[0]){
			var arg = args[0][cnt]
			var rule = arg.rule +";"+ args[1]
			NOTEDB.execute(this.db_sql_modifynote4rule,[arg.rulename,rule,arg.nid],[]);
		}
	},
	
	initReadingNotes:function(arg){
		var rslt = NOTEDB.execute(this.db_sql_searchrules,[],['nid','rule','rulename','content','lastupdated']);
		return{url:arg,notes:rslt}
	},
	
	getAllRules:function(){
		return NOTEDB.execute(this.db_sql_searchrules,[],['rule']);
	},
	
	initNote : function(args,outputflg) {
		var notes,mappingArray = ["nid", "cid", "content", "catalog","rule","rulename","lastupdated","link"];		
		if(args == null || args.opt == 'null' || args.opt == 'all'){
			notes = NOTEDB.execute(genSqlStr(this.db_sql_searchnotebypage),[],mappingArray);
		}
		else if(args.opt ==='catalog'){
			if(args.cond){
			   notes = NOTEDB.execute(genSqlStr(this.db_sql_searchnotebycatalog), [parseInt(args.cond)],mappingArray);
			}else{
			   notes = NOTEDB.execute(genSqlStr(this.db_sql_searchnotebycatalog), [''],mappingArray);
			}
		}
		else if(args.opt ==='label'){
		   notes = NOTEDB.execute(genSqlStr(this.db_sql_selectnotebylabel),[args.cond], mappingArray);
		}
		else if(args.opt ==='keyword'){
			notes = NOTEDB.execute(genSqlStr(this.db_sql_selectnotebyword), ['%'+args.cond+'%'], mappingArray);
		}
		return notes;
		
		function genSqlStr(sql){
			if(outputflg) return sql;
			var pagenum = parseInt(NOTEHelper.pageshowingitemnum),page = 1;
			if (args && args.page > 0) {
				page =  args.page 
			}
			return sql + " limit " + parseInt(pagenum + 1) + " offset " + (page-1 ) * pagenum
		}
	},
	
	updateLink:function(arg){
		NOTEDB.execute(this.db_sql_updatelink, [arg.link,arg.nid])
		return arg;
	},
	
	saveNotes:function(args){
		return this.initNote(args,true)
	},
	
	deleteNote : function(nid) {
		NOTEDB.execute(this.db_sql_deletenote, [nid]);
		NOTEDB.execute(this.db_sql_deletenotelabel, [nid]);
		return nid
	},

	modifyCatalog : function(args) {
		NOTEDB.execute(this.db_sql_modifycatalog, [args.name, parseInt(args.cid)]);
		args.nids = NOTEDB.execute(this.db_sql_searchnotebycatalog,[parseInt(args.cid)],['nid'])
		return args;
	},

	addCatalog : function(name) {
		NOTEDB.execute(this.db_sql_addcatalog,[name])
		return NOTEDB.execute(this.db_sql_maxcataid,[],["cid"])[0].cid;
	},

	addNote : function(args) {
		var time = parseInt(new Date().getTime());
		args.nid = NOTEDB.makeGUID()
		NOTEDB.execute(this.db_sql_addnote,[args.nid ,args.content,time,args.cid,time,args.link])
		return args;
	},
	
	addNullNote:function(args){
		return this.addNote({content:'',cid:'',catalog:""})
	},
	
	modifyNote : function(args) {
		var time = new Date().getTime();
		args.lastupdated=time;
		NOTEDB.execute(this.db_sql_modifynote, [args.content,parseInt(time),args.nid])
		return args;
	},

	setNotelabel:function(args){
		var nid =args.nid;
		var oldlabelstring = args.oldlabelstring;
		var labelstring = args.labelstring;
		
		if(oldlabelstring === labelstring) return null;
		
		var labels = _genObejct(labelstring);
		var oldlabels = _genObejct(oldlabelstring);
		
		var newLabels = {};        
		for(var l in labels){
			if(oldlabels[l]!==-1){
				newLabels[l]=-1;
			}else{
				delete oldlabels[l];
			}
		}
		
		if(_genString(newLabels)){
			var _labels = NOTEDB.execute(this.db_sql_selectlabel.replace('?1',_genString(newLabels)),null,["id","name"]);
			for(var cnt in _labels){			
				 newLabels[_labels[cnt].name]=_labels[cnt].id 
			}
		}
		
		for(var cnt in newLabels){
			if(newLabels[cnt]==-1){
				NOTEDB.execute(this.db_sql_addlabel,[cnt])
				newLabels[cnt]=NOTEDB.execute(this.db_sql_maxlabelid,[],["lid"])[0].lid;
			}
			NOTEDB.execute(this.db_sql_addnotelabel,[nid,newLabels[cnt]])
		}
		
		if(_genString(oldlabels)){
			 _labels = NOTEDB.execute(this.db_sql_selectlabel.replace('?1',_genString(oldlabels)),null,["id","name"]);
			//_labels = NOTEDB.searchLabel(_genString(oldlabels));
			for(var cnt in _labels){			
				 oldlabels[_labels[cnt].name]=_labels[cnt].id 
			}
		 }
		 
		for(var l in oldlabels){
			NOTEDB.execute(this.db_sql_removenotelabel,[nid ,oldlabels[l]]);
		}
		
		return nid;
		
		function _genObejct(string) {
			var tmpArray = string.split(',')
			var tmpObj = {};
			for (var cnt in tmpArray) {
				var l = tmpArray[cnt].trim();
				if(l=='') continue;
				tmpObj[l] = -1;
			}
			return tmpObj
		}
		
		function _genString(obj){
			var str=[];
			for(var l in obj){
				str.push(l)
			}
			return "'"+str.join("','")+"'"
		}
	},

	init : function(args) {
		var catalogs = NOTEDBOpt.getAllCatalog();
		var notes = this.initNote(args)
		return {notes : notes,catalogs : catalogs};
	},
	
	initCatalog:function(){
		var catalogs = NOTEDBOpt.getAllCatalog();
		return {catalogs:catalogs}
	},

	initToolbarCatalogMenu:function(){
		return NOTEDBOpt.initCatalog()
	},
	
	appendCatalog : function(name) {
		var cid = NOTEDBOpt.addCatalog(name);
		return {cid : cid,name : name}
	},
	
	appendCatalog2 : function(name) {
		return NOTEDBOpt.appendCatalog(name)
	},

	initContextMenu : function() {
		return NOTEDBOpt.getAllCatalog();
	},
	
	removeCatalog : function(cid) {
		var rows = NOTEDB.execute(this.db_sql_searchnotebycatalognum,[cid],['notecnt'])[0].notecnt
		if (rows == 0) {
			NOTEDB.execute(this.db_sql_removecatalog,[parseInt(cid)]);
		}
		return {rows : rows,cid : cid}
	},
	
	removeTagByName:function(name){
		NOTEDB.execute(this.db_sql_delete_labelbyname,[name]);		
	},
	
	initEditorCatalog:function(content){
		var catalogs = NOTEDBOpt.getAllCatalog();
		return {cata:catalogs,content:content}
	},
	
	addNoteFromEditor:function(args){		
		args.nid = NOTEDBOpt.addNote((args)).nid
		NOTEDBOpt.setNotelabel(args)
		return {cid:args.cid,nid:args.nid}
	},
	
	modifyNoteCatalog:function(args){
		NOTEDB.execute(this.db_sql_modifynote2,[parseInt(args.cid),args.nid])
		return args;
	},
	initTagSuggestion:function(arg){
		return [NOTEDB.execute(this.db_sql_searchlabelandcnt,[],['name','count']),arg]
	}
}

var NOTEUI = {
	 get PAGE(){ 
		return noteCache.PAGE || 1
	},
	 get SEARCHOPT(){
		return noteCache.SEARCHOPT || "all"
	},
	 get COND(){
		return noteCache.COND || ""
	},	
	 set PAGE(val){ 
		noteCache.PAGE = val;
	},
	 set SEARCHOPT(val){
		noteCache.SEARCHOPT = val;
	},
	 set COND(val){
		noteCache.COND = val;
	},
	get TYPE(){
		return noteCache.TYPE;
	},
	set TYPE(val){
		noteCache.TYPE = val;
	},
	
	init : function(args) {
		NOTEUI.CATALOG = $('listbox_note_catalog');
		NOTEUI.NOTE = $('box_note_notes');
		this.initCatalog(args);
		this.initNote(args.notes);
		initSearchBox();
		this._initSwitchModeMenuitem();
		this.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService); 
		this.observerService.addObserver(this._noteObserver, "note-note-change", false);  
	
		function initSearchBox(){
			$('note-labels').collapsed = false;
			if(NOTEUI.SEARCHOPT =='label' || NOTEUI.SEARCHOPT =='keyword')
				$('note-labels').setAttribute('value',NOTEUI.COND) // 恢复检索框的值
			$('note-labels').addEventListener('keyup',function(e){ // 检索
				NOTEAction.execute('searchNote',e)			
			},false);
			$('note-labels').addEventListener('focus',function(e){
				ce('label','note-labels',{'value':NOTEUI.TYPE==true?'T' :'K','id':'searchflgbtn'},{'click':function(){
					NOTEUI.TYPE =!(NOTEUI.TYPE);
					$('searchflgbtn').setAttribute('value',NOTEUI.TYPE==true?'T' :'K');
					$('searchflgbtn').setAttribute('tooltiptext',NOTEUI.TYPE==true?NOTEHelper.getStringbundle('searchbytag') :NOTEHelper.getStringbundle('searchbykeyword'));
					}})
			},false)
			$('note-labels').addEventListener('blur',function(e){
				$('note-labels').removeChild($('searchflgbtn'))	
			},false);
		}
	},
	
	_initSwitchModeMenuitem:function(){
		//var switchStr  = NOTEHelper.openmode == false ? NOTEHelper.getStringbundle('gotosidebarmode') : NOTEHelper.getStringbundle('gotopopupmode');
		var menuitem = document.getElementById('handynote-switchopenmode');
		//menuitem.setAttribute('label',switchStr);
		menuitem.addEventListener('command',function(e){
			if(NOTEHelper.openmode){
				var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIWebNavigation)
								 .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
								 .rootTreeItem
								 .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIDOMWindow);
				mainWindow.toggleSidebar('viewNoteSidebar');
			}else{
				window.close();
			}
			NOTEHelper.openmode=!NOTEHelper.openmode
			NOTEAction.execute('openNote');
		},false)
	
	},
	
	_noteObserver : {
		observe : function(aSubject, aTopic, aData) {
			if (aTopic == "note-note-change") {
				NOTEAction.execute('initNote');
				NOTEAction.execute('initCatalog');
			}
		}
	},
		
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// 分类相关
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    
	
    // 侧边栏/模式窗口-分类列表-初始化
    initCatalog : function(args) {
		NOTEUI._removeChildNodes(NOTEUI.CATALOG)
		NOTEUI._removeChildNodes($('note-catalogs-tabs'));
		ce('listitem',NOTEUI.CATALOG,{'label':NOTEHelper.getStringbundle("selectallitem")},{'click': function(e) {
				if (e.button ==0) NOTEAction.execute('initNote',NOTEUI._genPageInfo('all',''))
		}});
		ce('listitem',NOTEUI.CATALOG,{'label':NOTEHelper.getStringbundle("uncategorized")},{'click':function(e){
				if (e.button ==0) NOTEAction.execute('initNote',NOTEUI._genPageInfo('catalog',''))
		}});
		ce('tab','note-catalogs-tabs',{'label':NOTEHelper.getStringbundle("selectallitem")},{'click': function(e) {
				if (e.button ==0) NOTEAction.execute('initNote',NOTEUI._genPageInfo('all',''))
		}});
		ce('tab','note-catalogs-tabs',{'label':NOTEHelper.getStringbundle("uncategorized")},{'click':function(e){
				if (e.button ==0) NOTEAction.execute('initNote',NOTEUI._genPageInfo('catalog',''))
		}});
		for (var cnt in args.catalogs) {
			ce('listitem', NOTEUI.CATALOG, {
				'id': "listitem_catalog_" + args.catalogs[cnt].id,
				'label': args.catalogs[cnt].name,
				'cid': args.catalogs[cnt].id,
				'context': 'popup_cat_modify'
			}, {
				'click': function(e){
					if (e.button == 0) 
						NOTEAction.execute('initNote', NOTEUI._genPageInfo('catalog', e.target.getAttribute('cid')))
				}
			});
			ce('tab', 'note-catalogs-tabs', {
				'id': "tab_catalog_" + args.catalogs[cnt].id,
				'label': args.catalogs[cnt].name,
				'cid': args.catalogs[cnt].id,
				'height':25
			}, {
				'click': function(e){
					if (e.button == 0) 
						NOTEAction.execute('initNote', NOTEUI._genPageInfo('catalog', e.target.getAttribute('cid')))
				}
			});
		}
	},
	
    // 侧边栏/模式窗口-分类列表-添加分类
	appendCatalog : function(args) {
		ce('listitem', NOTEUI.CATALOG, {'id':"listitem_catalog_" + args.cid,'label' : args.name,'cid':args.cid,'context':'popup_cat_modify'}, {'click' : function(e){
			if (e.button ==0) NOTEAction.execute('initNote',NOTEUI._genPageInfo('catalog',e.target.getAttribute('cid')))
		}});
		// 同時添加到TABS
		ce('tab', 'note-catalogs-tabs', {'id':"tab_catalog_" + args.cid,'label' : args.name,'cid':args.cid}, {'click' : function(e){
			if (e.button ==0) NOTEAction.execute('initNote',NOTEUI._genPageInfo('catalog',e.target.getAttribute('cid')))
		}});
	},	
	
		
	// 侧边栏/模式窗口-分类列表-修改分类
	modifyCatalog : function(args) {
		NOTEUI.CATALOG.currentItem.setAttribute('label', args.name);
		$('tab_catalog_'+args.cid).setAttribute('label',args.name)		
	},
	
	
	// 侧边栏/模式窗口 -分类列-删除分类
	removeCatalog : function(args) {
		if (args.rows != 0) {
			alert(NOTEHelper.getStringbundle('deletecatalogerror'));
		} else {
			NOTEUI.CATALOG.removeChild(document.getElementById("listitem_catalog_"+ args.cid));
			$('note-catalogs-tabs').removeChild($("tab_catalog_"+ args.cid))
		}
	},
	
	
	// 初始化上下文分类菜单
	initContextMenu : function(catalogs) {
		var node = document.getElementById('menupopup_notes');
		NOTEUI._removeChildNodes(node)
		ce('menuitem',node,{'label':NOTEHelper.getStringbundle("uncategorized")},{'command':function(e){
				NOTEAction.execute("addNote",{cid : '',content : content.getSelection().toString(),ctrlKey : e.ctrlKey
			})}})
		for (var cnt in catalogs) {
			ce('menuitem',node,{'label':catalogs[cnt].name,'cid':catalogs[cnt].id},{'command':function(e){
				NOTEAction.execute("addNote",{cid : e.target.getAttribute('cid'),content : content.getSelection().toString(),ctrlKey : e.ctrlKey
			})}})
		}
	},
	
	// 初始化侧边栏分类下拉菜单
	initToolbarCatalogMenu:function(args){
		var aMenu = document.getElementById("note-sidebar-popup-catalog");
		NOTEUI._removeChildNodes(aMenu)
		
		ce('menuitem',aMenu,{'label':NOTEHelper.getStringbundle("selectallitem")},{'command':function(e) {
			NOTEAction.execute('initNote',NOTEUI._genPageInfo('all',''))
		}});
		ce('menuitem',aMenu,{'label':NOTEHelper.getStringbundle("uncategorized")},{'command':function(e){
			NOTEAction.execute('initNote',NOTEUI._genPageInfo('catalog',''))
		}});
		for (var cnt in args.catalogs) {
			ce('menuitem', aMenu, {'label' : args.catalogs[cnt].name,'cid':args.catalogs[cnt].id}, {'command' : function(e){
				NOTEAction.execute('initNote',NOTEUI._genPageInfo('catalog',e.target.getAttribute('cid')))
			}});
		}
	},
	
	// 从笔记编辑器添加分类
	appendCatalog2:function(args){
		ce('menuitem','note-editor-catalog',{cid:args.cid,label:args.name})
		var ic = document.getElementById('note-editor-menulist').itemCount;
		document.getElementById('note-editor-menulist').selectedIndex=ic-1;
		NOTEAction.execute('memoryEditorStatus');
	},

	
	// 初始化编辑器的分类下拉列表
	initEditorCatalog:function(args){
		var catalogPopup = $('note-editor-catalog');
		ce('menuitem',catalogPopup,{cid:'',label:NOTEHelper.getStringbundle('uncategorized')})
		for(var c in args.cata){
			var catalog = args.cata[c];
			ce('menuitem',catalogPopup,{cid:catalog.id,id:"note-editor-menuitem-"+catalog.id,label:catalog.name})
		}
		document.getElementById('note-editor-menulist').selectedIndex = 0
		var selectedItem =  $("note-editor-menuitem-" + NOTEHelper.editorstatus)
		if(selectedItem) {		
			document.getElementById('note-editor-menulist').selectedItem =selectedItem
		}
		document.getElementById('note-editor').setAttribute('value',args.content);
		document.getElementById('note-editor').setAttribute('style',NOTEHelper.getSelectedTextBoxStyle());
		document.getElementById('note-editor-label').setAttribute('style',NOTEHelper.getSelectedTagBoxStyle());
		document.getElementById('note-editor-label').addEventListener('blur',function(e){
			e.target.setAttribute('style', NOTEHelper.getSelectedTagBoxStyle());	
		},false);
		document.getElementById('note-editor-label').addEventListener('focus',function(e){
			e.target.setAttribute('style', NOTEHelper.getSelectedTagBoxStyle2());
		},false);
		
	},
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// 笔记相关
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	
	initNote : function(notes) {
		var length = initPageButton(notes);
		NOTEAction.execute('saveNote');
		NOTEUI._removeChildNodes(NOTEUI.NOTE);
		for (var cnt =0; cnt < length; cnt++) {
			NOTEUI.NOTE.appendChild(this._appendNote(notes[cnt]));
		}
		NOTEUI.selectedTextbox = null;
		
		if (NOTEUI.SEARCHOPT == 'label' || NOTEUI.SEARCHOPT == 'keyword') {
			$('note-catalogs-tabs').selectedIndex = -1
		}else if (NOTEUI.SEARCHOPT == 'all') {
				$('note-catalogs-tabs').selectedIndex = 0
		}else if (NOTEUI.COND) {
				$('note-catalogs-tabs').selectedItem = $('tab_catalog_' + NOTEUI.COND);
		}else {
				$('note-catalogs-tabs').selectedIndex = 1
		}

		if (NOTEUI.NOTE.childNodes && NOTEUI.NOTE.childNodes[0]) {
			var innerTextArea = NOTEUI.NOTE.childNodes[0];
			NOTEUI.defaultTextboxHeight = innerTextArea.clientHeight
			NOTEUI.NOTE.childNodes[0].childNodes[0].focus();
		}
		
		// 控制翻页按钮，并返回应迭代的条目数
		function initPageButton(notes){
			document.getElementById('note-btn-previoubox').setAttribute('collapsed',!(NOTEUI.PAGE>1));
			document.getElementById('note-btn-nextbox').setAttribute('collapsed',(notes.length <= NOTEHelper.pageshowingitemnum));
			if(notes.length == 0 ) return 0
			if(notes.length > NOTEHelper.pageshowingitemnum){
				return NOTEHelper.pageshowingitemnum
			}
			return notes.length 
		}
	},
	
	_genPageInfo:function(opt,cond){
		NOTEUI.PAGE = 1;
		NOTEUI.COND = cond;
		NOTEUI.SEARCHOPT = opt;
		return 	NOTEUI.getPageInfo();
	},
	
	getPageInfo:function(){
		return {page:NOTEUI.PAGE,cond:NOTEUI.COND,opt:NOTEUI.SEARCHOPT}	;
	},
	
	_appendNote:function(note){
			var div = document.createElement('vbox');
			div.setAttribute('id', "notediv-"+note.nid);
			var textBox = document.createElement('textbox');
			textBox.setAttribute('nid', note.nid);
			textBox.setAttribute('lastupdated', note.lastupdated);
			textBox.setAttribute('rule', note.rule);
			textBox.setAttribute('rulename', note.rulename);
			textBox.setAttribute('id', "textbox_" + note.nid);
			textBox.setAttribute('value', note.content);			
			textBox.setAttribute('multiline', false);
			textBox.setAttribute('catalog', note.catalog);
			textBox.setAttribute('cid', note.cid);
			textBox.setAttribute('link', note.link);
			if(NOTEHelper.showtooltip)
				textBox.setAttribute('tooltip',"note_html_tip")
			textBox.setAttribute('style', NOTEHelper.getTextBoxStyle());
			textBox.setAttribute('class', "plain");
			textBox.addEventListener("contextmenu", this._contextMenuHandle,false);		
			textBox.addEventListener("mouseover", this._mouseoverHandle,false);
			textBox.addEventListener("focus", this._modifyShape, false);
			
			div.appendChild(textBox);
			div.setAttribute('style',NOTEHelper.getBorderStyle());
			return div;
	},
	
	_setTextBoxStyle:function(node,flg){
		var n1 = document.getAnonymousNodes(node)[0];
		document.getAnonymousNodes(n1)[0].style['overflow']=(flg==true?"auto":"hidden");
	},
	
	_mouseoverHandle:function(e){
		var html = "<span>"+e.target.getAttribute("value")+"</span>";
		var html2 = "";
		if(NOTEHelper.tooltipshowcatalog){
			html2 = "<b><font color=orange>" +e.target.getAttribute('catalog')+"</font></b><br/>";
		}
		var div = document.getElementById("note_html_tip_div");
		while(div.firstChild) 
			div.removeChild(div.firstChild);
		var injectHTML = Components.classes["@mozilla.org/feed-unescapehtml;1"] 
		.getService(Components.interfaces.nsIScriptableUnescapeHTML) 
		.parseFragment(html2+html, false, null, div);
		div.appendChild(injectHTML);
	},	
		
	 _contextMenuHandle:function(e){
			var target = document.commandDispatcher.focusedElement;
			var contextMenu = document.getAnonymousElementByAttribute(target.parentNode,"anonid", "input-box-contextmenu");
			if(contextMenu.querySelector('#notelist-contextmenu-dn')){
				contextMenu.removeChild(document.getElementById('notelist-contextmenu-dn'))
				contextMenu.removeChild(document.getElementById('notelist-contextmenu-mc'))
				contextMenu.removeChild(document.getElementById('notelist-contextmenu-sr'))
			}	
				var menuItem = document.createElement("menuitem");
				menuItem.setAttribute("label", NOTEHelper.getStringbundle('deletenote'));
				menuItem.setAttribute("id", "notelist-contextmenu-dn");
				menuItem.setAttribute("nid", target.getAttribute('nid'));
				menuItem.addEventListener("command",function(){NOTEAction.execute('deleteNote')},false)
				contextMenu.appendChild(menuItem)
				ce('menuitem',contextMenu,{id:'notelist-contextmenu-sr',label:NOTEHelper.getStringbundle('setrule')},{command:function(){
					NOTEAction.execute('openSetReadingRule',[e.target.getAttribute('rule'),e.target.getAttribute('rulename'),e.target.getAttribute('nid'),e.target])
				}})
				ce('menuitem',contextMenu,{id:'notelist-contextmenu-sl',label:NOTEHelper.getStringbundle('setlink')},{command:function(){
					var newlink = prompt(NOTEHelper.getStringbundle('setlink'),e.target.getAttribute('link'))
					NOTEAction.execute('updateLink',{link:newlink,nid:e.target.getAttribute('nid')});
				}})
				var menu = document.createElement("menu");
				var popup = document.createElement("menupopup");
				menu.setAttribute('id','notelist-contextmenu-mc')
				menu.setAttribute('label',NOTEHelper.getStringbundle('modifynotecatalog'))
				menu.appendChild(popup)
				var cn = document.getElementById('listbox_note_catalog').childNodes
				var nid = e.target.getAttribute('nid')
				var cid = e.target.getAttribute('cid')
				if(cid){
					ce('menuitem', popup, {'label':NOTEHelper.getStringbundle("uncategorized"),'cid' : "",'nid':nid}, {'command' : function(e){
						NOTEAction.execute('modifyNoteCatalog',{nid :  e.target.getAttribute('nid'),cid :  e.target.getAttribute('cid'),catalog : ''})
					}});
				}
				for (var i = 0; i <= cn.length - 1; i++) {
					if(cn.item(i).getAttribute('cid') && cn.item(i).getAttribute('cid')!= cid){
						ce('menuitem', popup, {'label':cn.item(i).getAttribute('label'),'cid' : cn.item(i).getAttribute('cid'),'nid':nid}, {'command' : function(e){
							NOTEAction.execute('modifyNoteCatalog',{nid :  e.target.getAttribute('nid'),cid :  e.target.getAttribute('cid'),catalog : e.target.getAttribute('label')})
						}});
					}
				}
				contextMenu.appendChild(menu)
		},
	
	addNullNote:function(args){
		args.rulename=''
		args.rule=''
		NOTEUI.NOTE.insertBefore(this._appendNote(args),NOTEUI.NOTE.childNodes[0]);
	    NOTEUI.NOTE.childNodes[0].childNodes[0].focus();
	},

	saveReadingNotes:function(args){
		$('note-'+args.nid).setAttribute('lastupdated',args.lastupdated)
		$('note-'+args.nid).setAttribute('value',args.content)
		$('note-'+args.nid).value = args.content
	},
	
	getNotelabel:function(label){
		var labelbox = document.getElementById('note-labelbox');
		labelbox.setAttribute('oldlabels',label);
		labelbox.setAttribute('value',label);
	},

	deleteNote : function(nid) {
		NOTEUI.NOTE.removeChild(NOTEUI.selectedTextbox.parentNode);
		NOTEUI.NOTE.removeChild(document.getElementById('notearea-spliter'))
		NOTEUI.selectedTextbox = null;
	},
	
	openSettingUI:function(){
		window.openDialog("chrome://note/content/options.xul", "editor", ["dependent = yes,chrome=yes, dialog,centerscreen"]);
	},
	
	editNote:function(){
		var selectedText =""
		if(content) selectedText = content.getSelection();
		window.openDialog("chrome://note/content/editor.xul", "editor", [
						 "dependent = yes,titlebar, dialog,centerscreen,resizable"], selectedText);

	},
	
	openHelpPage:function(){
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIWebNavigation)
								 .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
								 .rootTreeItem
								 .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIDOMWindow);
		if(!mainWindow.gBrowser) mainWindow = NOTEUI.win;						 
		mainWindow.gBrowser.selectedTab = mainWindow.gBrowser.addTab("http://blog.csdn.net/handynote/archive/2010/09/13/5880877.aspx")
	},
	
	openLinkPage:function(link){
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIWebNavigation)
								 .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
								 .rootTreeItem
								 .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIDOMWindow);
		if(!mainWindow.gBrowser) mainWindow = NOTEUI.win;						 
		mainWindow.gBrowser.selectedTab = mainWindow.gBrowser.addTab(link)
	},
	
	showNote : function() {
		try {
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			var win = wm.getMostRecentWindow("handynote:popupwin");
			if (win) {
				win.focus()
			}
			else {
				var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIWebNavigation)
								 .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
								 .rootTreeItem
								 .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								 .getInterface(Components.interfaces.nsIDOMWindow);
				window.openDialog("chrome://note/content/note.xul", "handynote", ["titlebar", "resizable"],mainWindow);
			}
		}catch(e){
			alert(e)
		}
	},

	_modifyNote : function(e) {
		if(e && e.target){
			// if(e.target.value != e.target.getAttribute('value')){
				e.target.setAttribute('value', e.target.value);				
				NOTEAction.execute('modifyNote',{nid:e.target.getAttribute('nid'),content: e.target.value})
			//}
		}
	},
	
	saveNote:function(){
		if(NOTEUI.selectedTextbox){
			var nid= NOTEUI.selectedTextbox.getAttribute('nid')
			var lastupdated= NOTEUI.selectedTextbox.getAttribute('lastupdated')
			var rslt = NOTEAction.execute("checkLastUpdateData",nid)
			if(rslt[0].content != NOTEUI.selectedTextbox.value){
				if (rslt[0].lastupdated != NOTEUI.selectedTextbox.getAttribute('lastupdated')) {
					var r = {};
					window.openDialog("chrome://note/content/contentconfirm.xul", "", "chrome, dialog, modal, resizable=yes", rslt[0].content, NOTEUI.selectedTextbox.value, r);
					if (typeof r.content === 'string') {
						NOTEUI.selectedTextbox.value = r.content;
						NOTEUI.selectedTextbox.setAttribute('value', r.content);						
						this._modifyNote({target: NOTEUI.selectedTextbox})
					}
					else {
						NOTEUI.selectedTextbox.value = rslt[0].content;
						NOTEUI.selectedTextbox.setAttribute('lastupdated', rslt[0].lastupdated);
						NOTEUI.selectedTextbox.setAttribute('value', rslt[0].content);
					}
				}else{
					this._modifyNote({target: NOTEUI.selectedTextbox})
				}
			}
		}	
		if(document.getElementById('note-labelbox'))
			NOTEAction.execute('setNotelabel', {target: document.getElementById('note-labelbox')})
			
	},
	
	appendRule:function(){
		window.close();
	},

	_modifyShape : function(e) {
		if (NOTEUI.selectedTextbox) {
			var eid = e.target.getAttribute('id');
			var sid = NOTEUI.selectedTextbox.getAttribute('id');
			if (eid==sid)return;
			if(NOTEUI.selectedTextbox){
				NOTEAction.execute('saveNote');
				NOTEUI.selectedTextbox.setAttribute('multiline', false);
				NOTEHelper.noteareaheight = parseInt(NOTEUI.selectedTextbox.parentNode.height)
				NOTEUI.selectedTextbox.parentNode.parentNode.removeChild(document.getElementById('notearea-spliter'))
				NOTEUI.selectedTextbox.parentNode.removeChild(document.getElementById('note-toolbar'))
				NOTEUI.selectedTextbox.parentNode.removeChild(document.getElementById('note-labelbox'))
				NOTEUI.selectedTextbox.parentNode.height = NOTEUI.defaultTextboxHeight
				NOTEUI.selectedTextbox.setAttribute('style', NOTEHelper.getTextBoxStyle());	
			 }
		}
		initToolbar()
		// tag
		var labelbox = document.createElement('textbox');
		labelbox.setAttribute('id','note-labelbox')
		labelbox.setAttribute('nid',e.target.getAttribute('nid'));		
		labelbox.setAttribute('class','plain');
		labelbox.setAttribute('context','popoup-tagsuggestion')
		labelbox.setAttribute('style', NOTEHelper.getSelectedTagBoxStyle())
		labelbox.addEventListener('focus',function(e){
			labelbox.setAttribute('style', NOTEHelper.getSelectedTagBoxStyle2());	
		},false)
		labelbox.addEventListener('blur',function(e){
			labelbox.setAttribute('style', NOTEHelper.getSelectedTagBoxStyle());
			//if(e.target.getAttribute('nid')) NOTEAction.execute('setNotelabel',e)
		},false)
		
		e.target.parentNode.appendChild(labelbox)
		NOTEAction.execute('getNotelabel',e.target.getAttribute('nid'))
		
		var spliter = document.createElement('splitter')
		spliter.setAttribute('resizeafter','grow')
		spliter.setAttribute('id','notearea-spliter')
		e.target.parentNode.appendChild(spliter)
		e.target.parentNode.parentNode.insertBefore(spliter,e.target.parentNode.nextSibling)


		NOTEUI.selectedTextbox = e.target;		
		NOTEUI.selectedTextbox.parentNode.height = NOTEHelper.noteareaheight;
		e.target.setAttribute('flex', 1);
		e.target.setAttribute('multiline', true);
		e.target.setAttribute('style', NOTEHelper.getSelectedTextBoxStyle());

		
		// 选中笔记附加工具条
		function initToolbar(){
			var toolbar =  ce('hbox',null,{style: NOTEHelper.getTextboxToolbarStyle(),id:'note-toolbar'})
			var catalog = e.target.getAttribute('catalog')
			ce('label',toolbar,{'style':"color:orange;font-weight: bold",'id':"toolbarmenu",'value':catalog?catalog:NOTEHelper.getStringbundle('uncategorized')})
			ce('label',toolbar,{flex:1,})
			if(e.target.getAttribute('rule')){
				var ruleImg = 'chrome://note/skin/rule.png'
			}else{
				var ruleImg = 'chrome://note/skin/rule2.png'
			}
			if(e.target.getAttribute('link')){
				ce('toolbarbutton',toolbar,{tooltiptext:NOTEHelper.getStringbundle('noterelatedlink'),image:'chrome://note/skin/link.png'},{command: function(){NOTEAction.execute('openLinkPage',e.target.getAttribute('link'))}})
			}
			ce('toolbarbutton',toolbar,{tooltiptext:NOTEHelper.getStringbundle('noterule'),image:ruleImg},{command:function(){NOTEAction.execute('openSetReadingRule',[e.target.getAttribute('rule'),e.target.getAttribute('rulename'),e.target.getAttribute('nid'),e.target])}})
			ce('toolbarbutton',toolbar,{tooltiptext:NOTEHelper.getStringbundle('noteexport'),image:'chrome://note/skin/export.png'},{command:function(){NOTEHelper.saveFile(e.target.value)}})
			ce('toolbarbutton',toolbar,{tooltiptext:NOTEHelper.getStringbundle('notezommout'),image:'chrome://note/skin/zoom_in.png'},{command:function(){NOTEAction.execute('changeNoteFontSize',1)}})
			ce('toolbarbutton',toolbar,{tooltiptext:NOTEHelper.getStringbundle('notezoomin'),image:'chrome://note/skin/zoom_out.png'},{command:function(){NOTEAction.execute('changeNoteFontSize',-1)}})
			ce('toolbarbutton',toolbar,{tooltiptext:NOTEHelper.getStringbundle('notedelete'),image:'chrome://note/skin/remove.png'},{command:function(){NOTEAction.execute('deleteNote')}})
			e.target.parentNode.insertBefore(toolbar,e.target)
		}
	},
	
	// 初始化建议POPUP
	initTagSuggestion:function(args){
		var arg = args[0]
		var targetBox = args[1]
		NOTEUI._removeChildNodes($('note-labels-popoup'));
		var tags ={},tmp={},curtTagArray=[];
		var curtTags = $(targetBox).value.split(',')
		// 处理DB中的Tags
		for (var i = 0; i < arg.length; i++) {
			tags[arg[i].name]={}
			tags[arg[i].name].selected=false;
			tags[arg[i].name].count=arg[i].count;
		}
		// 处理当前的tags
		for	(var i =0 ;i<curtTags.length ;i++){
				var aTag = curtTags[i].trim();
				if(aTag == '') continue;
				if(!tags[aTag]){
					tags[aTag]={};
					tags[aTag].count = -1;
				}				
				tags[aTag].selected = true;
				tmp[aTag] = true;
		}
		for(var t in tmp){
			curtTagArray.push(t)
		}
		// 整理标签
		$(targetBox).value = curtTagArray.join(',') 
		// 初始化建议内容
		for(var n in tags){
			var item  = ce('richlistitem','note-labels-popoup');
			ce('checkbox',item,{label:n,checked:tags[n].selected,crop:'left'},{command: selectChkBox})
			ce('label',item,{flex:1})
			if(tags[n].count==0)
			   ce('toolbarbutton',item,{image:'chrome://note/skin/remove.png',value:n},{command:deleteTag})
		}
		
		function deleteTag(e){
			NOTEAction.execute('removeTagByName',e.target.getAttribute('value'));
			$('note-labels-popoup').removeChild(e.target.parentNode)
		}
		
		function selectChkBox(e){
			if(e.target.getAttribute('checked')){
				if($(targetBox).value.trim()==''){
					$(targetBox).value += e.target.label								
				}else{
					$(targetBox).value += ","+ e.target.label
				}
			}else{
				var str = ','+$(targetBox).value+','
				str= str.replace(','+e.target.label+",",',')
				if (str == ',') {
					$(targetBox).value =''
				} else {
					$(targetBox).value = str.substring(1,str.length-1)
				}
			}
			$(targetBox).focus()
		}
	},
	
	modifyNote:function (args){
		document.getElementById('textbox_'+args.nid).setAttribute('lastupdated',args.lastupdated)
		document.getElementById('textbox_'+args.nid).setAttribute('value',args.content)
		return args.nid;
	},
	
	initAppendRule:function(args){
		$('url').value =window.opener.opener.window.content.location.href
		$('rulelist').addEventListener('dblclick',function(){NOTEAction.execute('openRuleEditor')},false)
		for(var cnt in args){
			var item = ce('richlistitem','rulelist');
			var desc = ce('ruledescription',item);
			desc.setRuleInfo(args[cnt]);
		}
	},
	
	initReadingNotes:function(arg){
		var notes= arg.notes,url=arg.url;
		while($('ReadingNotes-tabs').firstChild){
			$('ReadingNotes-tabs').removeChild($('ReadingNotes-tabs').firstChild)
			$('ReadingNotes-panels').removeChild($('ReadingNotes-panels').firstChild)
		}
		for (var cnt in notes) {
			if (NOTEHelper.testRule(url,notes[cnt].rule) || $('handynote-autofilter-button').collapsed) {
				ce('tab','ReadingNotes-tabs',{id :notes[cnt].nid,nid:notes[cnt].nid,label:notes[cnt].rulename},{command:function(e){
					if(!noteCache.readingnote)noteCache.readingnote={}
					noteCache.readingnote[url]=e.target.getAttribute('id');
					noteCache.lastreadingnote = e.target.getAttribute('id');
					document.getElementById('note-'+e.target.getAttribute('id')).focus()
				}})
				ce('textbox','ReadingNotes-panels',{id:"note-"+notes[cnt].nid,nid:notes[cnt].nid,lastupdated:notes[cnt].lastupdated,value:notes[cnt].content,multiline:true,flex:1,style:NOTEHelper.getSelectedTextBoxStyle()},{
					blur: function(e){
						NOTEAction.execute('saveReadingNotes',e.target.getAttribute('id'))
					}
				});
			}
			$('ReadingNotes-tabs').selectedIndex='0'
		}
		if(noteCache.readingnote && noteCache.readingnote[url]){
			$('ReadingNotes-tabs').selectedItem = $(noteCache.readingnote[url]);
		}else if(noteCache && noteCache.lastreadingnote){
			$('ReadingNotes-tabs').selectedItem = $(noteCache.lastreadingnote);
		};
	},
	
	changeNoteFontSize:function(offset){
		if (NOTEHelper.fontSize2) {
			NOTEHelper.fontSize2 = parseInt(NOTEHelper.fontSize2) + offset;
			NOTEUI.selectedTextbox.setAttribute('style', NOTEHelper.getSelectedTextBoxStyle());
		}
	},
	
	_removeChildNodes : function(node) {
		if(node){
			for (var cnt = node.childNodes.length - 1; cnt >= 0; cnt--) {
				node.removeChild(node.childNodes[cnt]);
			}
		}
	},
	
	updateReadingRule:function(arg){
		if (window.arguments[0][4] == 'edit') {
			window.arguments[0][3].setRuleInfo({rulename:arg.name,rule:arg.rule})
		}else if (window.arguments[0][4] == 'create') {
			var item =ce('richlistitem',window.arguments[0][3],{},{},true)
			var desc =ce('ruledescription',item)
			desc.setRuleInfo({rulename:arg.name,rule:arg.rule,nid:arg.nid});
		}else{
			var target = window.arguments[0][3]
			target.setAttribute('rulename', arg.name)
			target.setAttribute('rule', arg.rule)
		}
		return true;
	},
	addNoteFromEditor:function(arg){
		return true;
	},
	
	updateLink:function(arg){
		NOTEUI.selectedTextbox.setAttribute('link',arg.link)
	},
	
	memoryEditorStatus:function(){
		NOTEHelper.editorstatus = parseInt(document.getElementById('note-editor-menulist').selectedItem.getAttribute('cid'))
	},
	
	viewNotebookInfo:function(args){
		alert(NOTEHelper.getStringbundle('viewnotebookinfo',[args.note,args.catalog,args.label,args.notelabel]));
	},
	
	modifyNoteCatalog:function(args){
		NOTEUI.selectedTextbox.setAttribute('cid',args.cid)
		NOTEUI.selectedTextbox.setAttribute('catalog',args.catalog)
		if(document.getElementById('toolbarmenu'))
			document.getElementById('toolbarmenu').setAttribute('value',args.catalog?args.catalog:NOTEHelper.getStringbundle('uncategorized'));
	},

	saveNotes:function(notes){
		var data = "",nullLine = "\r\n\r\n";
		var spStr = '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
		for(var cnt in notes){
			data+=notes[cnt].content+nullLine+spStr+nullLine;
		}
		NOTEHelper.saveFile(data)
	},
	
	helpBackup:function(){
		if(confirm(NOTEHelper.getStringbundle('backuphelp'))){
			var propertiesService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
		  var currProfD = propertiesService.get("ProfD", Ci.nsIFile);
		  var profileDir = currProfD.path;
		  var nsLocalFile = Components.Constructor("@mozilla.org/file/local;1", "nsILocalFile", "initWithPath");
		  new nsLocalFile(profileDir).reveal();
		}
	}
}
	return NOTEAction;
})();