(function(){
    Components.utils.import('resource://note/cache.js');
    var noteOverlay = {
        onLoad: function(){
            this.initContextMenuEvent(document.getElementById("contentAreaContextMenu"))
            this.registerWeave();
			this.firstRun();
            setTimeout(this.newlyVersionIntroduction, 5000);
        },
        
        initContextMenuEvent: function(contextMenu){
            if (contextMenu) {
                contextMenu.addEventListener("popupshowing", function(e){
                    var show = document.getElementById("menu_note");
                    show.hidden = !(gContextMenu.isTextSelected);
                }, false);
            }
        },
		
		firstRun:function(){
//		    if (Application.extensions) {
//				if(Application.extensions.get('note@mattmonkey').firstRun){
//					handle()
//				}
//            }else {
//                Components.utils.import("resource://gre/modules/AddonManager.jsm");
//                AddonManager.getAddonByID('note@mattmonkey', function(addons){
//					alert(addons.version)
//                   if(addons.version=='0.1'){
//				   	 handle()
//				   }
//                })
//            }
 			var flg = Application.prefs.getValue('extensions.note.firstrunflg',null);
			if (!flg) {
				handle();
				Application.prefs.setValue('extensions.note.firstrunflg',true);
			}
			function handle(){
				try {
				   var firefoxnav = document.getElementById("nav-bar");
				   var curSet = firefoxnav.currentSet;
				   if (curSet.indexOf("note-toolbar-viewnote") == -1){
				     var set;
				     if (curSet.indexOf("urlbar-container") != -1)
				       set = curSet.replace(/urlbar-container/, "note-toolbar-addnote,note-toolbar-viewnote,urlbar-container");
				     else  // at the end
					     set = curSet + ",note-toolbar-addnote,note-toolbar-viewnote";
				     firefoxnav.setAttribute("currentset", set);
				     firefoxnav.currentSet = set;
				     document.persist("nav-bar", "currentset");
					 try {
				       BrowserToolboxCustomizeDone(true);
				     }
			    	 catch (e) { }
				   }
				 }
				 catch(e) { }
			}

		},
        
        newlyVersionIntroduction: function(){
            if (Application.extensions) {
				var curtVersion = Application.extensions.get('note@mattmonkey').version;
			}
            else {
                Components.utils.import("resource://gre/modules/AddonManager.jsm");
                AddonManager.getAddonByID('note@mattmonkey', function(addons){
                    openHelpPage(addons.version);
                    return;
                })
            }
            openHelpPage(curtVersion)
            function openHelpPage(curtVersion){
                var versionRecd = Application.prefs.getValue('extensions.note.versionrec', '0.1.0')
                if (curtVersion > versionRecd) {
                    gBrowser.selectedTab = gBrowser.addTab("http://blog.csdn.net/handynote/archive/2010/09/03/5862114.aspx")
                    Application.prefs.setValue('extensions.note.versionrec', curtVersion)
                }
            }
        },
        
        
        registerWeave: function(){
            try {
                if (Weave) {
                    Components.utils.import('resource://note/sync.js');
                    Components.utils.import('resource://note/cache.js');
                    Weave.Engines.register(HandyNoteEngine);
                }
            } catch (e) {
            }
        }        
    }
    
    
    
    window.addEventListener("load", function(e){
        noteOverlay.onLoad(e);
    }, false);
})();

