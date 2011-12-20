const EXPORTED_SYMBOLS = ['HandyNoteEngine','syncdb'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://note/cache.js");

Cu.import("resource://services-sync/engines.js");
Cu.import("resource://services-sync/util.js");
Cu.import("resource://services-sync/stores.js");
Cu.import("resource://services-sync/base_records/crypto.js");
Cu.import("resource://services-sync/trackers.js");
Cu.import("resource://services-sync/ext/Observers.js");


// 引擎类
function HandyNoteEngine() {	
	LOG("HandyNoteEngine init")
	SyncEngine.call(this, "HandyNote");
}

HandyNoteEngine.prototype = {
	__proto__ : SyncEngine.prototype,
	_recordObj : HandyNoteRecord,
	_storeObj : HandyNoteStore,
	_trackerObj : HandyNoteTracker
};

// 存储类
function HandyNoteStore(name) {
	LOG('HandyNoteStore init')
	Store.call(this, name);
}

HandyNoteStore.prototype = {
	__proto__ : Store.prototype,

	itemExists : function(guid) {
		LOG('HandyNoteStore  itemExists')
		return syncdb.itemExists(guid)
	},
	
	createRecord : function(guid) {
		LOG('HandyNoteStore  createRecord ' + guid)
		var record = new HandyNoteRecord();
		var aNote = syncdb.getNote(guid);
		if(aNote.length>0){
			record.id = aNote[0].guid;
			record.guid = aNote[0].guid;
		    record.content = aNote[0].content
			record.catalog = aNote[0].catalog;
			record.lastupdated = aNote[0].lastupdated;
			record.created = aNote[0].created;
			record.labels = aNote[0].labels
			record.rule = aNote[0].rule
			record.rulename = aNote[0].rulename
			record.link = aNote[0].link
			LOG('record.rule '+record.rule)
		}else{
			record.deleted = true;
		}
		return record;
	},

	changeItemId : function(oldId, newId) {
		LOG('HandyNoteStore  changeItemId')
	},

	getAllIDs : function() {
		LOG('HandyNote store  getAllIds ')
		var rslt = {};
		var ids = syncdb.getAllIDs();
		for(var cnt in ids ){
			rslt[ids[cnt].guid] = ids[cnt].guid
		}
		return rslt
	},

	wipe : function() {
		LOG('HandyNoteStore  wipe ')
		syncdb.clear();
	},

	create : function(record) {
		LOG('HandyNoteStore  create' + record.id)
		syncdb.addNote(record)
	},

	update : function(record) {
		LOG('HandyNoteStore  update')
		LOG("update ~~ " + record.catalog);
		LOG("update ~~ " + record.content);
		LOG("update ~~ " + record.guid);
		syncdb.updateNote(record)
	},

	remove : function(record) {
		LOG('HandyNoteStore remove')
		syncdb.removeNote(record.guid)
	}
}

// 数据类型类
function HandyNoteRecord(uri) {
	LOG("HandyNoteRecord init ")
	CryptoWrapper.call(this, uri);
}

HandyNoteRecord.prototype = {
	__proto__ : CryptoWrapper.prototype,
	_logname : "Record.HandyNote",

	_HandyNoteRecord_init : function HandyNoteItem_init(uri) {
		this._CryptoWrap_init(uri);
		this.cleartext = {};
	}
}

Utils.deferGetSet(HandyNoteRecord, "cleartext", ["content","guid","catalog","created","lastupdated",'labels','link','rule','rulename']);

// tracker
function HandyNoteTracker(name) {
	LOG("HandyNoteTracker init")
	Tracker.call(this, name);
	Svc.Obs.add("note-notifier", this);
}

HandyNoteTracker.prototype = {
	__proto__ : Tracker.prototype,

//	QueryInterface : XPCOMUtils.generateQI([Ci.nsIFormSubmitObserver,Ci.nsIObserver]),
 	QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
	
	observe : function observe(subject, topic, guid) {
		LOG('HandyNoteTarcker topic ' +guid)
		LOG("updated" + guid)
		this.addChangedID(guid);
		this._updateScore();
	},
	
	_updateScore:function(){
		this.score++;
		LOG(this.score)
	}

};

function LOG(msg) {
    //	return;
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
			.getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage(msg);
}

var syncdb = {
	
	itemExists:function(guid){
		var sql = 'SELECT note_id AS guid FROM note where note.note_id = ?1'
		var rslt = NOTEDB.execute(sql,[guid],['guid'])
		return rslt.length > 0;
	},
	
	addNote:function(record){
		noteCache.reset()
		var cid = this.getCatalogId(record.catalog)
		LOG(record.guid)
		LOG(record.content)
		LOG(record.created)
		LOG(record.lastupdated)
		LOG(record.link)
		LOG(record.rule)
		LOG(record.rulename)
		var aNote = [record.guid,record.content,cid,record.created,record.lastupdated,record.rule,record.rulename,record.link]
		var sql = "INSERT INTO note (note_id, content,catalog_id,create_date,lastupdate_date,rule,rulename,link) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)"
		NOTEDB.execute(sql,aNote);
		this.addLabels(record)
	},
	
	addLabels :function(record){
		if (record.labels) {
			var labels = this.getLabelIds(record.labels)
			var sql = "INSERT INTO notelabel (note_id, label_id) VALUES(?1,?2)"
			for (var cnt in labels) {
				NOTEDB.execute(sql, [record.guid, labels[cnt]]);
			}
		}
	},
	
	updateNote:function(record){
		noteCache.reset()
		var cid = this.getCatalogId(record.catalog);
		var aNote = [record.content,cid,record.created,record.lastupdated,record.guid,record.rule,record.rulename,record.link]
		var sql = "UPDATE note SET content = ?1 , catalog_id = ?2,create_date = ?3, lastupdate_date =?4,rule =?5 ,rulename = ?6, link= ?7 WHERE note_id = ?5"
		NOTEDB.execute(sql,aNote);
		NOTEDB.execute("delete from notelabel where note_id = ?1",[record.guid]);
		this.addLabels(record);
	},
	
	getLabelIds:function(labels){
		var tags = labels.split(',')
		if(tags.length ==0) return [];
		var rslt = [];
		for(var cnt in tags){
			if(tags[cnt]=='') continue;
			var sql = "SELECT label_id AS lid FROM label WHERE label.label_name = ?1"
			var checkRslt  = NOTEDB.execute(sql,[tags[cnt]],['lid'])
			if(checkRslt.length>0){
				rslt.push(checkRslt[0].lid);
			}else{
				NOTEDB.execute("INSERT INTO label (label_name) VALUES(?1)",[tags[cnt]])
			    rslt.push(NOTEDB.execute("SELECT max(ROWID) as lid FROM label",[],["lid"])[0].lid)
			}
		}
		return rslt;
	},
	
	getCatalogId:function(catalog){
		if(!catalog) return '';
		var sql = "SELECT catalog_id AS cid FROM catalog WHERE catalog.catalog_name = ?1"
		var checkRslt  = NOTEDB.execute(sql,[catalog],['cid'])
		if(checkRslt.length>0){
			return checkRslt[0].cid
		}else{
			NOTEDB.execute("INSERT INTO catalog (catalog_name) VALUES(?1)",[catalog])
		    return NOTEDB.execute("SELECT max(ROWID) as cid FROM catalog",[],["cid"])[0].cid;
		}
	},
	
	getNote:function(guid){
		var sql = "SELECT l.label_name AS label FROM label AS l join notelabel AS nl on l.label_id = nl.label_id where nl.note_id  = ?1"
		var rslt = NOTEDB.execute(sql,[guid],['label']);
		var labelstr = [];
		for(var cnt in rslt){
			labelstr.push(rslt[cnt].label)
		}
		sql = "SELECT n.note_id AS guid,c.catalog_name AS catalog, n.content,n.create_date AS created,n.lastupdate_date AS lastupdated ,n.rule, n.rulename, n.link FROM note AS n left join catalog AS c on n.catalog_id = c.catalog_id WHERE n.note_id = ?1"		
		rslt = NOTEDB.execute(sql,[guid],['guid','content','catalog','created','lastupdated','rule','rulename','link']);
		if(rslt.length>0){
			rslt[0].labels = labelstr.join(',')
		}
		return rslt;
	},
	
	removeNote:function(guid){
		noteCache.reset()
		NOTEDB.execute("delete from note where note_id = ?1",[guid])	
		NOTEDB.execute("delete from notelabel where note_id = ?1",[guid])
	},
	
	clear:function(){
		NOTEDB.execute("DELETE FROM catalog");
		NOTEDB.execute("DELETE FROM note");
		NOTEDB.execute("DELETE FROM notelabel");
		NOTEDB.execute("DELETE FROM label");
	},
	
	getAllIDs:function(){
		//LOG('getAllIDs')
		return NOTEDB.execute('SELECT note_id AS guid FROM note',[],['guid']);
	}
}