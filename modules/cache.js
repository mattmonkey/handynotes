var EXPORTED_SYMBOLS = ['noteCache','test','NOTEDB'];

var noteCache = {
	cache : {},
	conn : null,
	setCache : function(sql, arg1, arg2, rslt) {
		if (sql.trim().substring(0, 6).toUpperCase() === 'SELECT') {
			this.cache[sql + "|" + arg1 + "|" + arg2] = rslt;
		} else {
			this.reset();
		}
	},

	getCache : function(sql, arg1, arg2) {
		return this.cache[sql + "|" + arg1 + "|" + arg2];
	},

	reset : function() {
		this.cache = {};
	}
}

	
 function LOG(msg) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage(msg);
}
	
	

var NOTEDB = {
	db_def_catalog : "catalog_id INTEGER PRIMARY KEY AUTOINCREMENT,catalog_name TEXT",
	db_def_note : "note_id TEXT PRIMARY KEY, content TEXT, catalog_id INTEGER,create_date INTEGER, lastupdate_date INTEGER, rulename Text, rule Text, link Text",
	db_def_label : "label_id INTEGER PRIMARY KEY AUTOINCREMENT, label_name TEXT",
	db_def_notelabel : "label_id INTEGER, note_id TEXT, primary key (label_id,note_id)",
	db_check_structure : "SELECT name,sql FROM sqlite_master WHERE name= ?1",	

	// 执行器
	execute : function(sql, arg, arg2, conn) {
		try {
			// 内部连接用缓存
			if (typeof conn == 'undefined') {
				// 检查缓存
				var rslt = noteCache.getCache(sql, arg, arg2)
				if (rslt) {return rslt;}
			}
			var stmt = this.execSQL(sql, arg, conn);
			//if(arg2 !=null)
				var rslt = mappingRslt(stmt, arg2);
			if (typeof conn == 'undefined' && rslt != null) {
				// 设置缓存
				noteCache.setCache(sql, arg, arg2, rslt);
			}
			return rslt
		} catch (e) {
			throw e;
		} finally {
			if (stmt)
				stmt.reset();
		}
		
		// 映射返回结果
		 function mappingRslt(stmt, args) {
			var rslt = [];
			try {
				while (stmt.executeStep()) {
					var aRow = {}
					for (var cnt in args) {
						aRow[args[cnt]] = stmt.row[args[cnt]]
					}
					rslt.push(aRow)
				}
			}catch(e){
				throw e
			}
			return rslt
		}
	},

	// 执行SQl
	execSQL : function(sql, args, conn) {
		var _conn;
		if (conn) {
			_conn = conn
		} else {
			_conn = this.conn
		}

		try{
			var stmt = _conn.createStatement(sql);
		}catch(e){
			LOG(e)
			LOG(sql)
			throw e
		}
		for (var cnt in args) {
			if (typeof(args[cnt]) == 'number') {
				stmt.bindInt64Parameter(cnt, args[cnt]);
			}
			else if (typeof(args[cnt]) == 'string' || typeof(args[cnt]) == 'object') {
				    stmt.bindStringParameter(cnt, args[cnt]);
			}
			
		}
		return stmt;
	},

	openDatabaseFile:function(fileName) {
		var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
		file.append(fileName)
		var storageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
		return storageService.openDatabase(file);
	},

	checkTableStructure : function(conn, isRebuild) {
		var tablenames = ["catalog", "note", "label", "notelabel"]
				
		for (var cnt in tablenames) {
			if (!conn.tableExists(tablenames[cnt])) {
				// 重建
				if (isRebuild) {
					conn.createTable(tablenames[cnt], this["db_def_"
									+ tablenames[cnt]]);
				}
			} else {
				if(tablenames[cnt] == "note"){
					try{
						this.execute("select rulename from note where 1=2",[],[],conn);
					}catch(e){
						this.execute("Alter Table note ADD rulename Text",[],[],conn);
						
					}
					try{
						this.execute("select rule from note where 1=2",[],[],conn);
					}catch(e){
						this.execute("Alter Table note ADD rule Text",[],[],conn);						
					}
					try{
						this.execute("select link from note where 1=2",[],[],conn);
					}catch(e){
						this.execute("Alter Table note ADD link Text",[],[],conn);						
					}
				}
				// 表结构检查
				var table = this.execute(this.db_check_structure, [tablenames[cnt]], ['name', 'sql'], conn)
				if (genStr(tablenames[cnt], this["db_def_" + tablenames[cnt]]) != table[0].sql) {
					throw this[tables[cnt].name] + " table error !!!"
				}
			}
		}

		return true;

		function genStr(table, sql) {
			return "CREATE TABLE " + table + " (" + sql + ")"
		}
	},

	beginTransaction : function() {
		this.conn.beginTransaction();
	},

	commitTransaction : function() {
		this.conn.commitTransaction();
	},

	rollbackTransaction : function() {
		this.conn.rollbackTransaction();
	},
	
	makeGUID : function makeGUID() {
		const code = "!()*-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~";
		var guid = "";
		var num = 0;
		var val;
		for (var i = 0; i < 10; i++) {
			if (i == 0 || i == 5)
				num = Math.random();
			num *= 70;
			val = Math.floor(num);
			guid += code[val];
			num -= val;
		}
		return guid;
	},
	
	get conn () {
		// 缓存连接
		if(!noteCache.conn) this.init();
		return noteCache.conn
	},
	
	init:function(){
		if (!noteCache.conn) {
			var _conn = this.openDatabaseFile("handynote.sqlite");
			this.checkTableStructure(_conn, true)
			noteCache.conn = _conn
		}	
	}
};
