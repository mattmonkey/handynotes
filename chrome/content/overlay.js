(function(){
    Components.utils.import('resource://note/cache.js');
    var noteOverlay = {
        onLoad: function(){
            this.initContextMenuEvent(document.getElementById("contentAreaContextMenu"))
        },
        
        initContextMenuEvent: function(contextMenu){
            if (contextMenu) {
                contextMenu.addEventListener("popupshowing", function(e){
                    var show = document.getElementById("menu_note");
                    show.hidden = !(gContextMenu.isTextSelected);
                }, false);
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
              
    }
    
    
    
    window.addEventListener("load", function(e){
        noteOverlay.onLoad(e);
    }, false);
})();

