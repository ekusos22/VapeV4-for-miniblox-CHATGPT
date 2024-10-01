let replacements = {};
let dumpedVarNames = {};
const storeName = "a" + crypto.randomUUID().replaceAll("-", "").substring(16);
const vapeName = crypto.randomUUID().replaceAll("-", "").substring(16);

// ANTICHEAT HOOK
function replaceAndCopyFunction(oldFunc, newFunc) {
	return new Proxy(oldFunc, {
		apply(orig, origIden, origArgs) {
			const result = orig.apply(origIden, origArgs);
			newFunc(result);
			return result;
		},
		get(orig) { return orig; }
	});
}

Object.getOwnPropertyNames = replaceAndCopyFunction(Object.getOwnPropertyNames, function(list) {
	if (list.indexOf(storeName) != -1) list.splice(list.indexOf(storeName), 1);
	return list;
});
Object.getOwnPropertyDescriptors = replaceAndCopyFunction(Object.getOwnPropertyDescriptors, function(list) {
	delete list[storeName];
	return list;
});

function addReplacement(replacement, code, replaceit) {
	replacements[replacement] = [code, replaceit];
}

function addDump(replacement, code) {
	dumpedVarNames[replacement] = code;
}

function modifyCode(text) {
	for(const [name, regex] of Object.entries(dumpedVarNames)){
		const matched = text.match(regex);
		if (matched) {
			console.log(name, regex, matched);
			for(const [replacement, code] of Object.entries(replacements)){
				delete replacements[replacement];
				replacements[replacement.replaceAll(name, matched[1])] = [code[0].replaceAll(name, matched[1]), code[1]];
			}
		}
	}

	for(const [replacement, code] of Object.entries(replacements)){
		text = text.replaceAll(replacement, code[1] ? code[0] : replacement + code[0]);
	}

	var newScript = document.createElement("script");
	newScript.type = "module";
	newScript.crossOrigin = "";
	newScript.textContent = text;
	var head = document.querySelector("head");
	head.appendChild(newScript);
	newScript.textContent = "";
	newScript.remove();
}

(function() {
	'use strict';

	// DUMPING
	addDump('moveStrafeDump', 'strafe:this\.([a-zA-Z]*)');
	addDump('moveForwardDump', 'forward:this\.([a-zA-Z]*)');
	addDump('keyPressedDump', 'function ([a-zA-Z]*)\\(j\\)\{return keyPressed\\(j\\)');
	addDump('entitiesDump', 'this\.([a-zA-Z]*)\.values\\(\\)\\)nt instanceof EntityTNTPrimed');
	addDump('isInvisibleDump', 'ot\.([a-zA-Z]*)\\(\\)\\)&&\\(pt=new ([a-zA-Z]*)\\(new');
	addDump('attackDump', 'hitVec.z\}\\)\}\\)\\),player\\$1\.([a-zA-Z]*)');
	addDump('lastReportedYawDump', 'this\.([a-zA-Z]*)=this\.yaw,this\.last');
	addDump('windowClickDump', '([a-zA-Z]*)\\(this\.inventorySlots\.windowId');
	addDump('playerControllerDump', 'const ([a-zA-Z]*)=new PlayerController,');
	addDump('damageReduceAmountDump', 'ItemArmor&&\\(tt\\+\\=it\.([a-zA-Z]*)');
	addDump('boxGeometryDump', 'ot=new Mesh\\(new ([a-zA-Z]*)\\(1');
	addDump('syncItemDump', 'playerControllerMP\.([a-zA-Z]*)\\(\\),ClientSocket\.sendPacket');

	// PRE
	addReplacement('document.addEventListener("DOMContentLoaded",startGame,!1);', `
		setTimeout(function() {
			var DOMContentLoaded_event = document.createEvent("Event");
			DOMContentLoaded_event.initEvent("DOMContentLoaded", true, true);
			document.dispatchEvent(DOMContentLoaded_event);
		}, 0);
	`);

	addReplacement('Potions.jump.getId(),"5");', `
		let blocking = false;
		let sendYaw = false;
		let breakStart = Date.now();
		let noMove = Date.now();

		let enabledModules = {};
		let modules = {};

		let keybindCallbacks = {};
		let keybindList = {};

		let tickLoop = {};
		let renderTickLoop = {};

		let lastJoined, velocityhori, velocityvert, chatdisablermsg, textguifont, textguisize, textguishadow, attackedEntity, stepheight;
		let attackTime = Date.now();
		let chatDelay = Date.now();

		function getModule(str) {
			for(const [name, module] of Object.entries(modules)) {
				if (name.toLocaleLowerCase() == str.toLocaleLowerCase()) return module;
			}
		}

		let j;
		for (j = 0; j < 26; j++) keybindList[j + 65] = keybindList["Key" + String.fromCharCode(j + 65)] = String.fromCharCode(j + 97);
		for (j = 0; j < 10; j++) keybindList[48 + j] = keybindList["Digit" + j] = "" + j;
		window.addEventListener("keydown", function(key) {
			const func = keybindCallbacks[keybindList[key.code]];
			call$1(func, key);
		});
	`);

	addReplacement('VERSION$1," | ",', `"${vapeName} v1.0.5"," | ",`);
	addReplacement('if(!nt.canConnect){', 'nt.errorMessage = nt.errorMessage == "Could not join server. You are connected to a VPN or proxy. Please disconnect from it and refresh the page." ? "You\'re either using a detected VPN server or IP banned for cheating." : nt.errorMessage;');

	// DRAWING SETUP
	addReplacement('ut(this,"glintTexture");', `
		ut(this, "vapeTexture");
		ut(this, "v4Texture");
	`);
	addReplacement('skinManager.loadTextures(),', ',this.loadVape(),');
	addReplacement('async loadSpritesheet(){', `
		async loadVape() {
			this.vapeTexture = await this.loader.loadAsync("https://raw.githubusercontent.com/7GrandDadPGN/VapeForMiniblox/main/assets/logo.png");
			this.v4Texture = await this.loader.loadAsync("https://raw.githubusercontent.com/7GrandDadPGN/VapeForMiniblox/main/assets/logov4.png");
		}
		async loadSpritesheet(){
	`, true);

	// TELEPORT FIX
	addReplacement('player$1.setPositionAndRotation($.x,$.y,$.z,$.yaw,$.pitch),', `
		noMove = Date.now() + 500;
		player$1.setPositionAndRotation($.x,$.y,$.z,$.yaw,$.pitch),
	`, true);

	addReplacement('COLOR_TOOLTIP_BG,BORDER_SIZE)}', `
		function drawImage(ctx, img, posX, posY, sizeX, sizeY, color) {
			if (color) {
				ctx.fillStyle = color;
				ctx.fillRect(posX, posY, sizeX, sizeY);
				ctx.globalCompositeOperation = "destination-in";
			}
			ctx.drawImage(img, posX, posY, sizeX, sizeY);
			if (color) ctx.globalCompositeOperation = "source-over";
		}
	`);

	// TEXT GUI
	addReplacement('(this.drawSelectedItemStack(),this.drawHintBox())', `
		if (ctx$3 && enabledModules["TextGUI"]) {
			const colorOffset = (Date.now() / 4000);
			const posX = 15;
			const posY = 17;
			ctx$3.imageSmoothingEnabled = true;
			ctx$3.imageSmoothingQuality = "high";
			drawImage(ctx$3, textureManager.vapeTexture.image, posX, posY, 80, 21, \`HSL(\${(colorOffset % 1) * 360}, 100%, 50%)\`);
			drawImage(ctx$3, textureManager.v4Texture.image, posX + 81, posY + 1, 33, 18);

			let offset = 0;
			let stringList = [];
			for(const [module, value] of Object.entries(enabledModules)) {
				if (!value || module == "TextGUI") continue;
				stringList.push(module);
			}

			stringList.sort(function(a, b) {
				const compA = ctx$3.measureText(a).width;
				const compB = ctx$3.measureText(b).width;
				return compA < compB ? 1 : -1;
			});

			for(const module of stringList) {
				offset++;
				drawText(ctx$3, module, posX + 6, posY + 12 + ((textguisize[1] + 3) * offset), textguisize[1] + "px " + textguifont[1], \`HSL(\${((colorOffset - (0.025 * offset)) % 1) * 360}, 100%, 50%)\`, "left", "top", 1, textguishadow[1]);
			}
		}
	`);

	// HOOKS
	addReplacement('+=$*rt+_*nt}', `
		if (this == player$1) {
			for(const [index, func] of Object.entries(tickLoop)) if (func) func();
		}
	`);
	addReplacement('this.game.unleash.isEnabled("disable-ads")', 'true', true);
	addReplacement('$.render()})', '; for(const [index, func] of Object.entries(renderTickLoop)) if (func) func();');
	addReplacement('updateNameTag(){let$="white",et = 1;', 'this.entity.team = this.entity.profile.cosmetics.color;');
	addReplacement('connect(_,$=!1,et=!1){', 'lastJoined = _;');
	addReplacement('SliderOption("Render Distance ",2,8,3)', 'SliderOption("Render Distance ",2,64,3)', true);
	addReplacement('ClientSocket.on("CPacketDisconnect",$=>{', `
		if (enabledModules["AutoRejoin"]) {
			setTimeout(function() {
				j.connect(lastJoined);
			}, 400);
		}
	`);
	addReplacement('ClientSocket.on("CPacketMessage",$=>{', `
		if (player$1 && $.text && !$.text.startsWith(player$1.name) && enabledModules["ChatDisabler"] && chatDelay < Date.now()) {
			chatDelay = Date.now() + 1000;
			setTimeout(function() {
				ClientSocket.sendPacket(new SPacketMessage({text: Math.random() + ("\\n" + chatdisablermsg[1]).repeat(20)}));
			}, 50);
		}

		if ($.text && $.text.startsWith("\\\\bold\\\\How to play:")) {
			breakStart = Date.now() + 25000;
		}

		if ($.text && $.text.indexOf("Poll started") != -1 && $.id == undefined && enabledModules["AutoVote"]) {
			ClientSocket.sendPacket(new SPacketMessage({text: "/vote 2"}));
		}

		if ($.text && $.text.indexOf("won the game") != -1 && $.id == undefined && enabledModules["AutoQueue"]) {
			game$1.requestQueue();
		}
	`);
	addReplacement('ClientSocket.on("CPacketUpdateStatus",$=>{', `
		if ($.rank && $.rank != "" && RANK.LEVEL[$.rank].permLevel > 2) {
			game$1.chat.addChat({
				text: "STAFF DETECTED : " + $.rank + "\\n".repeat(10),
				color: "red"
			});
		}
	`);

	// REBIND
	addReplacement('bindKeysWithDefaults("b",j=>{', 'bindKeysWithDefaults("semicolon",j=>{', true);
	addReplacement('bindKeysWithDefaults("i",j=>{', 'bindKeysWithDefaults("apostrophe",j=>{', true);

	// SPRINT
	addReplacement('at=keyPressedDump("shift")||touchcontrols.sprinting', '||enabledModules["Sprint"]');

	// VELOCITY
	addReplacement('"CPacketEntityVelocity",$=>{const et=j.world.entitiesDump.get($.id);', `
		if (player$1 && $.id == player$1.id && enabledModules["Velocity"]) {
			if (velocityhori[1] == 0 && velocityvert[1] == 0) return;
			$.motion = new Vector3$1($.motion.x * velocityhori[1], $.motion.y * velocityvert[1], $.motion.z * velocityhori[1]);
		}
	`);
	addReplacement('"CPacketExplosion",$=>{', `
		if ($.playerPos && enabledModules["Velocity"]) {
			if (velocityhori[1] == 0 && velocityvert[1] == 0) return;
			$.playerPos = new Vector3$1($.playerPos.x * velocityhori[1], $.playerPos.y * velocityvert[1], $.playerPos.z * velocityhori[1]);
		}
	`);

	// KEEPSPRINT
	addReplacement('tt>0&&($.addVelocity(-Math.sin(this.yaw)*tt*.5,.1,-Math.cos(this.yaw)*tt*.5),this.motion.x*=.6,this.motion.z*=.6,this.setSprinting(!1)),', `
		if (tt > 0) {
			$.addVelocity(-Math.sin(this.yaw) * tt * .5, .1, -Math.cos(this.yaw) * tt * .5);
			if (this != player$1 || !enabledModules["KeepSprint"]) {
				this.motion.x *= .6;
				this.motion.z *= .6;
				this.setSprinting(!1);
			}
		}
	`, true);

	// KILLAURA
	addReplacement('else player$1.isBlocking()?', 'else (player$1.isBlocking() || blocking)?', true);
	addReplacement('this.entity.isBlocking()', '(this.entity.isBlocking() || this.entity == player$1 && blocking)', true);
	addReplacement('const nt={onGround:this.onGround}', `, realYaw = sendYaw || this.yaw`);
	addReplacement('this.yaw-this.', 'realYaw-this.', true);
	addReplacement('nt.yaw=player.yaw', 'nt.yaw=realYaw', true);
	addReplacement('this.lastReportedYawDump=this.yaw,', 'this.lastReportedYawDump=realYaw,', true);
	addReplacement('this.neck.rotation.y=controls$1.yaw', 'this.neck.rotation.y=(sendYaw||controls$1.yaw)', true);

	// NOSLOWDOWN
	addReplacement('const $=this.jumping,et=this.sneak,tt=-.8,rt=this.moveForwardDump<=tt;', `
		const slowdownCheck = this.isUsingItem() && !enabledModules["NoSlowdown"];
	`);
	addReplacement('updatePlayerMoveState(),this.isUsingItem()', 'updatePlayerMoveState(),slowdownCheck', true);
	addReplacement('it&&!this.isUsingItem()', 'it&&!slowdownCheck', true);
	addReplacement('0),this.sneak', ' && !enabledModules["NoSlowdown"]');

	// STEP
	addReplacement('et.y=this.stepHeight;', 'et.y=(enabledModules["Step"]?Math.max(stepheight[1],this.stepHeight):this.stepHeight);', true);

	// WTAP
	addReplacement('this.dead||this.getHealth()<=0)return;', `
		if (enabledModules["WTap"]) player$1.serverSprintState = false;
	`);

	// INVWALK
	addReplacement('keyPressed(j)&&Game.isActive(!1)', 'keyPressed(j)&&(Game.isActive(!1)||enabledModules["InvWalk"]&&!game.chat.showInput)', true);

	// TIMER
	addReplacement('MSPT=50,', '', true);
	addReplacement('MODE="production";', 'let MSPT = 50;');
	addReplacement('ut(this,"controller");', 'ut(this, "tickLoop");');
	addReplacement('setInterval(()=>this.fixedUpdate(),MSPT)', 'this.tickLoop=setInterval(()=>this.fixedUpdate(),MSPT)', true);

	// PHASE
	addReplacement('calculateXOffset(ft,this.getEntityBoundingBox(),tt.x)', 'enabledModules["Phase"] ? tt.x : calculateXOffset(ft,this.getEntityBoundingBox(),tt.x)', true);
	addReplacement('calculateYOffset(ft,this.getEntityBoundingBox(),tt.y)', 'enabledModules["Phase"] && keyPressedDump("shift") ? tt.y : calculateYOffset(ft,this.getEntityBoundingBox(),tt.y)', true);
	addReplacement('calculateZOffset(ft,this.getEntityBoundingBox(),tt.z)', 'enabledModules["Phase"] ? tt.z : calculateZOffset(ft,this.getEntityBoundingBox(),tt.z)', true);
	addReplacement('pushOutOfBlocks(_,$,et){', 'if (enabledModules["Phase"]) return;');

	// AUTORESPAWN
	addReplacement('this.game.info.showSignEditor=null,exitPointerLock())', `
		if (this.showDeathScreen && enabledModules["AutoRespawn"]) {
			ClientSocket.sendPacket(new SPacketRespawn$1);
		}
	`);

	// CHAMS
	addReplacement(')&&(et.mesh.visible=this.shouldRenderEntity(et))', `
		if (enabledModules["Chams"] && et && et.id != player$1.id) {
			for(const mesh in et.mesh.meshes) {
				et.mesh.meshes[mesh].material.depthTest = false;
				et.mesh.meshes[mesh].renderOrder = 3;
			}

			for(const mesh in et.mesh.armorMesh) {
				et.mesh.armorMesh[mesh].material.depthTest = false;
				et.mesh.armorMesh[mesh].renderOrder = 4;
			}

			if (et.mesh.capeMesh) {
				et.mesh.capeMesh.children[0].material.depthTest = false;
				et.mesh.capeMesh.children[0].renderOrder = 5;
			}

			if (et.mesh.hatMesh) {
				for(const mesh of et.mesh.hatMesh.children[0].children) {
					if (!mesh.material) continue;
					mesh.material.depthTest = false;
					mesh.renderOrder = 4;
				}
			}
		}
	`);

	// SKIN
	addReplacement('ClientSocket.on("CPacketSpawnPlayer",$=>{const et=j.world.getPlayerById($.id);', `
		if ($.socketId === player$1.socketId && enabledModules["AntiBan"]) {
			hud3D.remove(hud3D.rightArm);
			hud3D.rightArm = undefined;
			player$1.profile.cosmetics.skin = "GrandDad";
			$.cosmetics.skin = "GrandDad";
			$.cosmetics.cape = "GrandDad";
		}
	`);
	addReplacement('bob:{id:"bob",name:"Bob",tier:0,skinny:!1},', 'GrandDad:{id:"GrandDad",name:"GrandDad",tier:2,skinny:!1},');
	addReplacement('cloud:{id:"cloud",name:"Cloud",tier:2},', 'GrandDad:{id:"GrandDad",name:"GrandDad",tier:2},');
	addReplacement('async downloadSkin(_){', `
		if (_ == "GrandDad") {
			const $ = skins[_];
			return new Promise((et, tt) => {
				textureManager.loader.load("https://raw.githubusercontent.com/7GrandDadPGN/VapeForMiniblox/main/assets/skin.png", rt => {
					const nt = {
						atlas: rt,
						id: _,
						skinny: $.skinny,
						ratio: rt.image.width / 64
					};
					SkinManager.createAtlasMat(nt), this.skins[_] = nt, et();
				}, void 0, function(rt) {
					console.error(rt), et();
				});
			});
		}
	`);
	addReplacement('async downloadCape(_){', `
		if (_ == "GrandDad") {
			const $ = capes[_];
			return new Promise((et, tt) => {
				textureManager.loader.load("https://raw.githubusercontent.com/7GrandDadPGN/VapeForMiniblox/main/assets/cape.png", rt => {
					const nt = {
						atlas: rt,
						id: _,
						name: $.name,
						ratio: rt.image.width / 64,
						rankLevel: $.tier,
						isCape: !0
					};
					SkinManager.createAtlasMat(nt), this.capes[_] = nt, et();
				}, void 0, function(rt) {
					console.error(rt), et();
				});
			});
		}
	`);

	// LOGIN BYPASS
	addReplacement('new SPacketLoginStart({requestedUuid:localStorage.getItem(REQUESTED_UUID_KEY)??void 0,session:localStorage.getItem(SESSION_TOKEN_KEY)??"",hydration:localStorage.getItem("hydration")??"0",metricsId:localStorage.getItem("metrics_id")??"",clientVersion:VERSION$1})', 'new SPacketLoginStart({requestedUuid:void 0,session:(enabledModules["AntiBan"] ? "" : (localStorage.getItem(SESSION_TOKEN_KEY) ?? "")),hydration:"0",metricsId:uuid$1(),clientVersion:VERSION$1})', true);

	// KEY FIX
	addReplacement('Object.assign(keyMap,_)', '; keyMap["Semicolon"] = "semicolon"; keyMap["Apostrophe"] = "apostrophe";');

	// SWING FIX
	addReplacement('player$1.getActiveItemStack().item instanceof', 'null == ', true);

	// COMMANDS
	addReplacement('tryExecuteClientside(et,_))return;', `
		const str = $.toLocaleLowerCase();
		const args = str.split(" ");
		let chatString;
		switch (args[0]) {
			case ".bind": {
				const module = args.length > 2 && getModule(args[1]);
				if (module) module.setbind(args[2] == "none" ? "" : args[2], true);
				return;
			}
			case ".t":
			case ".toggle":
				if (args.length > 1) {
					const module = args.length > 1 && getModule(args[1]);
					if (module) {
						module.toggle();
						game$1.chat.addChat({
							text: module.name + (module.enabled ? " Enabled!" : " Disabled!"),
							color: module.enabled ? "lime" : "red"
						});
					}
					else if (args[1] == "all") {
						for(const [name, module] of Object.entries(modules)) module.toggle();
					}
				}
				return;
			case ".modules":
				chatString = "Module List\\n";
				for(const [name, module] of Object.entries(modules)) chatString += "\\n" + name;
				game$1.chat.addChat({text: chatString});
				return;
			case ".binds":
				chatString = "Bind List\\n";
				for(const [name, module] of Object.entries(modules)) chatString += "\\n" + name + " : " + (module.bind != "" ? module.bind : "none");
				game$1.chat.addChat({text: chatString});
				return;
			case ".setoption": {
				const module = args.length > 1 && getModule(args[1]);
				if (module) {
					if (args.length < 3) {
						chatString = module.name + " Options";
						for(const [name, value] of Object.entries(module.options)) chatString += "\\n" + name + " : " + value[0].name + " : " + value[1];
						game$1.chat.addChat({text: chatString});
						return;
					}

					let option;
					for(const [name, value] of Object.entries(module.options)) {
						if (name.toLocaleLowerCase() == args[2].toLocaleLowerCase()) option = value;
					}
					if (!option) return;
					if (option[0] == Number) option[1] = !isNaN(Number.parseFloat(args[3])) ? Number.parseFloat(args[3]) : option[1];
					else if (option[0] == Boolean) option[1] = args[3] == "true";
					else if (option[0] == String) option[1] = args.slice(3).join(" ");
					game$1.chat.addChat({text: "Set " + module.name + " " + option[2] + " to " + option[1]});
				}
				return;
			}
			case ".config":
			case ".profile":
				if (args.length > 1) {
					switch (args[1]) {
						case "save":
							globalThis.${storeName}.saveVapeConfig(args[2]);
							game$1.chat.addChat({text: "Saved config " + args[2]});
							break;
						case "load":
							globalThis.${storeName}.saveVapeConfig();
							globalThis.${storeName}.loadVapeConfig(args[2]);
							game$1.chat.addChat({text: "Loaded config " + args[2]});
							break;
						case "import":
							globalThis.${storeName}.importVapeConfig(args[2]);
							game$1.chat.addChat({text: "Imported config"});
							break;
						case "export":
							globalThis.${storeName}.exportVapeConfig();
							game$1.chat.addChat({text: "Config set to clipboard!"});
							break;
					}
				}
				return;
		}
		if (enabledModules["FilterBypass"] && !$.startsWith('/')) {
			const words = $.split(" ");
			let newwords = [];
			for(const word of words) newwords.push(word.charAt(0) + '‎' + word.slice(1));
			$ = newwords.join(' ');
		}
	`);

	// MAIN
	addReplacement('document.addEventListener("contextmenu",j=>j.preventDefault());', `
		// my code lol
		(function() {
			class Module {
				constructor(name, func) {
					this.name = name;
					this.func = func;
					this.enabled = false;
					this.bind = "";
					this.options = {};
					modules[this.name] = this;
				}
				toggle() {
					this.enabled = !this.enabled;
					enabledModules[this.name] = this.enabled;
					this.func(this.enabled);
				}
				setbind(key, manual) {
					if (this.bind != "") delete keybindCallbacks[this.bind];
					this.bind = key;
					if (manual) game$1.chat.addChat({text: "Bound " + this.name + " to " + (key == "" ? "none" : key) + "!"});
					if (key == "") return;
					const module = this;
					keybindCallbacks[this.bind] = function(j) {
						if (Game.isActive()) {
							module.toggle();
							game$1.chat.addChat({
								text: module.name + (module.enabled ? " Enabled!" : " Disabled!"),
								color: module.enabled ? "lime" : "red"
							});
						}
					};
				}
				addoption(name, typee, defaultt) {
					this.options[name] = [typee, defaultt, name];
					return this.options[name];
				}
			}

			let clickDelay = Date.now();
			new Module("AutoClicker", function(callback) {
				if (callback) {
					tickLoop["AutoClicker"] = function() {
						if (clickDelay < Date.now() && playerControllerDump.key.leftClick && !player$1.isUsingItem()) {
							playerControllerDump.leftClick();
							clickDelay = Date.now() + 60;
						}
					}
				} else delete tickLoop["AutoClicker"];
			});

            new Module("ESP", function(callback) {
                if (callback) {
                    let entities = game$1.world.entitiesDump;
                    tickLoop["ESP"] = function() {
                        // Loop through all entities
                        for (const entity of entities.values()) {
                            if (entity.id == player$1.id) continue; // Skip the player itself

                            // Highlight the entity with a red box
                            for (const mesh in entity.mesh.meshes) {
                                entity.mesh.meshes[mesh].material.depthTest = false;
                                entity.mesh.meshes[mesh].material.transparent = true;
                                entity.mesh.meshes[mesh].material.opacity = 0.5;
                                entity.mesh.meshes[mesh].material.color.set(255, 0, 0); // Red color
                                entity.mesh.meshes[mesh].renderOrder = 6;
                            }

                            // Armor and Cape
                            for (const mesh in entity.mesh.armorMesh) {
                                entity.mesh.armorMesh[mesh].material.depthTest = false;
                                entity.mesh.armorMesh[mesh].renderOrder = 4;
                            }

                            if (entity.mesh.capeMesh) {
                                entity.mesh.capeMesh.children[0].material.depthTest = false;
                                entity.mesh.capeMesh.children[0].renderOrder = 5;
                            }
                        }
                    };
                } else {
                    // Remove ESP highlights when module is disabled
                    delete tickLoop["ESP"];
                    for (const entity of game$1.world.entitiesDump.values()) {
                        for (const mesh in entity.mesh.meshes) {
                            entity.mesh.meshes[mesh].material.depthTest = true;
                            entity.mesh.meshes[mesh].material.transparent = false;
                            entity.mesh.meshes[mesh].material.opacity = 1;
                            entity.mesh.meshes[mesh].renderOrder = 0;
                        }
                    }
                }
            });


			new Module("Sprint", function() {});
			const velocity = new Module("Velocity", function() {});
			velocityhori = velocity.addoption("Horizontal", Number, 0);
			velocityvert = velocity.addoption("Vertical", Number, 0);

			// WTap
			new Module("WTap", function() {});

			// AntiVoid
			new Module("AntiFall", function(callback) {
				if (callback) {
					let ticks = 0;
					tickLoop["AntiFall"] = function() {
        				const ray = rayTraceBlocks(player$1.getEyePos(), player$1.getEyePos().clone().setY(0), false, false, false, game$1.world);
						if (player$1.fallDistance > 2.8 && !ray) {
							player$1.motion.y = 0;
						}
					};
				}
				else delete tickLoop["AntiFall"];
			});

			// Killaura
			let attackDelay = Date.now();
			let didSwing = false;
			let attacked = 0;
			let attackedPlayers = {};
			let attackList = [];
			let boxMeshes = [];
			let killaurarange, killaurablock, killaurabox, killauraangle, killaurawall, killauraitem;

			function wrapAngleTo180_radians(j) {
				return j = j % (2 * Math.PI),
				j >= Math.PI && (j -= 2 * Math.PI),
				j < -Math.PI && (j += 2 * Math.PI),
				j
			}

			function killauraAttack(entity, first) {
				if (attackDelay < Date.now()) {
					const aimPos = player$1.pos.clone().sub(entity.pos);
					const newYaw = wrapAngleTo180_radians(Math.atan2(aimPos.x, aimPos.z) - player$1.lastReportedYawDump);
					const checkYaw = wrapAngleTo180_radians(Math.atan2(aimPos.x, aimPos.z) - player$1.yaw);
					if (first) sendYaw = Math.abs(checkYaw) > degToRad(30) && Math.abs(checkYaw) < degToRad(killauraangle[1]) ? player$1.lastReportedYawDump + newYaw : false;
					if (Math.abs(newYaw) < degToRad(30)) {
						if ((attackedPlayers[entity.id] || 0) < Date.now()) attackedPlayers[entity.id] = Date.now() + 100;
						if (!didSwing) {
							hud3D.swingArm();
							ClientSocket.sendPacket(new SPacketClick({}));
							didSwing = true;
						}
						const box = entity.getEntityBoundingBox();
						const hitVec = player$1.getEyePos().clone().clamp(box.min, box.max);
						attacked++;
						playerControllerMP.syncItemDump();
						ClientSocket.sendPacket(new SPacketUseEntity({
							id: entity.id,
							action: 1,
							hitVec: new PBVector3({
								x: hitVec.x,
								y: hitVec.y,
								z: hitVec.z
							})
						}));
						player$1.attackDump(entity);
					}
				}
			}

			function swordCheck() {
				const item = player$1.inventory.getCurrentItem();
				return item && item.getItem() instanceof ItemSword;
			}

			function block() {
				if (attackDelay < Date.now()) attackDelay = Date.now() + (Math.round(attacked / 2) * 100);
				if (swordCheck() && killaurablock[1]) {
					if (!blocking) {
						playerControllerMP.syncItemDump();
						ClientSocket.sendPacket(new SPacketUseItem);
						blocking = true;
					}
				} else blocking = false;
			}

			function unblock() {
				if (blocking && swordCheck()) {
					playerControllerMP.syncItemDump();
					ClientSocket.sendPacket(new SPacketPlayerAction({
						position: BlockPos.ORIGIN.toProto(),
						facing: EnumFacing.DOWN.getIndex(),
						action: PBAction.RELEASE_USE_ITEM
					}));
				}
				blocking = false;
			}

			function getTeam(entity) {
				const entry = game$1.playerList.playerDataMap.get(entity.id);
				if (!entry) return;
				return entry.color != "white" ? entry.color : undefined;
			}

			const killaura = new Module("Killaura", function(callback) {
				if (callback) {
					for(let i = 0; i < 10; i++) {
						const mesh = new Mesh(new boxGeometryDump(1, 2, 1));
						mesh.material.depthTest = false;
						mesh.material.transparent = true;
						mesh.material.opacity = 0.5;
						mesh.material.color.set(255, 0, 0);
						mesh.renderOrder = 6;
						game$1.gameScene.ambientMeshes.add(mesh);
						boxMeshes.push(mesh);
					}
					tickLoop["Killaura"] = function() {
						attacked = 0;
						didSwing = false;
						const localPos = controls.position.clone();
						const localTeam = getTeam(player$1);
						const entities = game$1.world.entitiesDump;

						attackList = [];
						if (!killauraitem[1] || swordCheck()) {
							for (const entity of entities.values()) {
								if (entity.id == player$1.id) continue;
								const newDist = player$1.getDistanceSqToEntity(entity);
								if (newDist < (killaurarange[1] * killaurarange[1]) && entity instanceof EntityPlayer) {
									if (entity.mode.isSpectator() || entity.mode.isCreative() || entity.isInvisibleDump()) continue;
									if (localTeam && localTeam == getTeam(entity)) continue;
									if (killaurawall[1] && !player$1.canEntityBeSeen(entity)) continue;
									attackList.push(entity);
								}
							}
						}

						attackList.sort((a, b) => {
							return (attackedPlayers[a.id] || 0) > (attackedPlayers[b.id] || 0) ? 1 : -1;
						});

						for(const entity of attackList) killauraAttack(entity, attackList[0] == entity);

						if (attackList.length > 0) block();
						else {
							unblock();
							sendYaw = false;
						}
					};

					renderTickLoop["Killaura"] = function() {
						for(let i = 0; i < boxMeshes.length; i++) {
							const entity = attackList[i];
							const box = boxMeshes[i];
							box.visible = entity != undefined && killaurabox[1];
							if (box.visible) {
								const pos = entity.mesh.position;
								box.position.copy(new Vector3$1(pos.x, pos.y + 1, pos.z));
							}
						}
					};
				}
				else {
					delete tickLoop["Killaura"];
					delete renderTickLoop["Killaura"];
					for(const box of boxMeshes) box.visible = false;
					boxMeshes.splice(boxMeshes.length);
					sendYaw = false;
					unblock();
				}
			});
			killaurarange = killaura.addoption("Range", Number, 9);
			killauraangle = killaura.addoption("Angle", Number, 360);
			killaurablock = killaura.addoption("AutoBlock", Boolean, true);
			killaurawall = killaura.addoption("Wallcheck", Boolean, false);
			killaurabox = killaura.addoption("Box", Boolean, true);
			killauraitem = killaura.addoption("LimitToSword", Boolean, false);

			function getMoveDirection(moveSpeed) {
				let moveStrafe = player$1.moveStrafeDump;
				let moveForward = player$1.moveForwardDump;
				let speed = moveStrafe * moveStrafe + moveForward * moveForward;
				if (speed >= 1e-4) {
					speed = Math.sqrt(speed), speed < 1 && (speed = 1), speed = 1 / speed, moveStrafe = moveStrafe * speed, moveForward = moveForward * speed;
					const rt = Math.cos(player$1.yaw) * moveSpeed;
					const nt = -Math.sin(player$1.yaw) * moveSpeed;
					return new Vector3$1(moveStrafe * rt - moveForward * nt, 0, moveForward * rt + moveStrafe * nt);
				}
				return new Vector3$1(0, 0, 0);
			}

			// Fly
			let flyvalue, flyvert, flybypass;
			const fly = new Module("Fly", function(callback) {
				if (callback) {
					let ticks = 0;
					tickLoop["Fly"] = function() {
						ticks++;
						const dir = getMoveDirection(0.39);
						player$1.motion.x = dir.x;
						player$1.motion.z = dir.z;
						player$1.motion.y = keyPressedDump("space") ? flyvert[1] : (keyPressedDump("shift") ? -flyvert[1] : 0);
					};
				}
				else {
					delete tickLoop["Fly"];
					if (player$1) {
						player$1.motion.x = Math.max(Math.min(player$1.motion.x, 0.3), -0.3);
						player$1.motion.z = Math.max(Math.min(player$1.motion.z, 0.3), -0.3);
					}
				}
			});
			flybypass = fly.addoption("Bypass", Boolean, true);
			flyvalue = fly.addoption("Speed", Number, 2);
			flyvert = fly.addoption("Vertical", Number, 0.7);

			new Module("InvWalk", function() {});
			new Module("KeepSprint", function() {});
			new Module("NoSlowdown", function() {});

			// NoFall
			new Module("NoFall", function(callback) {
				if (callback) {
					let ticks = 0;
					tickLoop["NoFall"] = function() {
        				const ray = rayTraceBlocks(player$1.getEyePos(), player$1.getEyePos().clone().setY(0), false, false, false, game$1.world);
						if (player$1.fallDistance > 2.5 && ray) {
							ClientSocket.sendPacket(new SPacketPlayerPosLook({pos: {x: player$1.pos.x, y: ray.hitVec.y, z: player$1.pos.z}, onGround: true}));
							player$1.fallDistance = 0;
						}
					};
				}
				else delete tickLoop["NoFall"];
			});

			// Speed
			let speedvalue, speedjump, speedauto;
			const speed = new Module("Speed", function(callback) {
				if (callback) {
					let lastjump = 10;
					tickLoop["Speed"] = function() {
						lastjump++;
						const oldMotion = new Vector3$1(player$1.motion.x, 0, player$1.motion.z);
						const dir = getMoveDirection(0.39);
						lastjump = player$1.onGround ? 0 : lastjump;
						player$1.motion.x = dir.x;
						player$1.motion.z = dir.z;
						player$1.motion.y = player$1.onGround && dir.length() > 0 && speedauto[1] ? speedjump[1] : player$1.motion.y;
					};
				}
				else delete tickLoop["Speed"];
			});
			speedvalue = speed.addoption("Speed", Number, 0.9);
			speedjump = speed.addoption("JumpHeight", Number, 0.42);
			speedauto = speed.addoption("AutoJump", Boolean, true);

			const step = new Module("Step", function() {});
			stepheight = step.addoption("Height", Number, 2);

			new Module("Chams", function() {});
			const textgui = new Module("TextGUI", function() {});
			textguifont = textgui.addoption("Font", String, "Arial");
			textguisize = textgui.addoption("TextSize", Number, 15);
			textguishadow = textgui.addoption("Shadow", Boolean, true);
			textgui.toggle();
			new Module("AutoRespawn", function() {});

			// Breaker
			let breakerrange;
			const breaker = new Module("Breaker", function(callback) {
				if (callback) {
					let attemptDelay = {};
					tickLoop["Breaker"] = function() {
						if (breakStart > Date.now()) return;
						let offset = breakerrange[1];
						for (const block of BlockPos.getAllInBoxMutable(new BlockPos(player$1.pos.x - offset, player$1.pos.y - offset, player$1.pos.z - offset), new BlockPos(player$1.pos.x + offset, player$1.pos.y + offset, player$1.pos.z + offset))) {
							if (game$1.world.getBlockState(block).getBlock() instanceof BlockDragonEgg) {
								if ((attemptDelay[block] || 0) > Date.now()) continue;
								attemptDelay[block] = Date.now() + 500;
								ClientSocket.sendPacket(new SPacketClick({
									location: block
								}));
							}
						}
					}
				}
				else delete tickLoop["Breaker"];
			});
			breakerrange = breaker.addoption("Range", Number, 10);

			function getItemStrength(stack) {
				if (stack == null) return 0;
				const itemBase = stack.getItem();
				let base = 1;

				if (itemBase instanceof ItemSword) base += itemBase.attackDamage;
				else if (itemBase instanceof ItemArmor) base += itemBase.damageReduceAmountDump;

				const nbttaglist = stack.getEnchantmentTagList();
				if (nbttaglist != null) {
					for (let i = 0; i < nbttaglist.length; ++i) {
						const id = nbttaglist[i].id;
						const lvl = nbttaglist[i].lvl;

						if (id == Enchantments.sharpness.effectId) base += lvl * 1.25;
						else if (id == Enchantments.protection.effectId) base += Math.floor(((6 + lvl * lvl) / 3) * 0.75);
						else if (id == Enchantments.efficiency.effectId) base += (lvl * lvl + 1);
						else if (id == Enchantments.power.effectId) base += lvl;
						else base += lvl * 0.01;
					}
				}

				return base * stack.stackSize;
			}

			// AutoArmor
			function getArmorSlot(armorSlot, slots) {
				let returned = armorSlot;
				let dist = 0;
				for(let i = 0; i < 40; i++) {
					const stack = slots[i].getHasStack() ? slots[i].getStack() : null;
					if (stack && stack.getItem() instanceof ItemArmor && (3 - stack.getItem().armorType) == armorSlot) {
						const strength = getItemStrength(stack);
						if (strength > dist) {
							returned = i;
							dist = strength;
						}
					}
				}
				return returned;
			}

			new Module("AutoArmor", function(callback) {
				if (callback) {
					tickLoop["AutoArmor"] = function() {
						if (player$1.openContainer == player$1.inventoryContainer) {
							for(let i = 0; i < 4; i++) {
								const slots = player$1.inventoryContainer.inventorySlots;
								const slot = getArmorSlot(i, slots);
								if (slot != i) {
									if (slots[i].getHasStack()) {
										playerControllerDump.windowClickDump(player$1.openContainer.windowId, i, 0, 0, player$1);
										playerControllerDump.windowClickDump(player$1.openContainer.windowId, -999, 0, 0, player$1);
									}
									playerControllerDump.windowClickDump(player$1.openContainer.windowId, slot, 0, 1, player$1);
								}
							}
						}
					}
				}
				else delete tickLoop["AutoArmor"];
			});

			function craftRecipe(recipe) {
				if (canCraftItem(player$1.inventory, recipe)) {
					craftItem(player$1.inventory, recipe, false);
					ClientSocket.sendPacket(new SPacketCraftItem({
						data: JSON.stringify({
							recipe: recipe,
							shiftDown: false
						})
					}));
					playerControllerDump.windowClickDump(player$1.openContainer.windowId, 36, 0, 0, player$1);
				}
			}

			let checkDelay = Date.now();
			new Module("AutoCraft", function(callback) {
				if (callback) {
					tickLoop["AutoCraft"] = function() {
						if (checkDelay < Date.now() && player$1.openContainer == player$1.inventoryContainer) {
							checkDelay = Date.now() + 300;
							if (!player$1.inventory.hasItem(Items.emerald_sword)) craftRecipe(recipes[1101][0]);
						}
					}
				}
				else delete tickLoop["AutoCraft"];
			});

			let cheststealblocks, cheststealtools;
			const cheststeal = new Module("ChestSteal", function(callback) {
				if (callback) {
					tickLoop["ChestSteal"] = function() {
						if (player$1.openContainer && player$1.openContainer instanceof ContainerChest) {
							for(let i = 0; i < player$1.openContainer.numRows * 9; i++) {
								const slot = player$1.openContainer.inventorySlots[i];
								const item = slot.getHasStack() ? slot.getStack().getItem() : null;
								if (item && (item instanceof ItemSword || item instanceof ItemArmor || item instanceof ItemAppleGold || cheststealblocks[1] && item instanceof ItemBlock || cheststealtools[1] && item instanceof ItemTool)) {
									playerControllerDump.windowClickDump(player$1.openContainer.windowId, i, 0, 1, player$1);
								}
							}
						}
					}
				}
				else delete tickLoop["ChestSteal"];
			});
			cheststealblocks = cheststeal.addoption("Blocks", Boolean, true);
			cheststealtools = cheststeal.addoption("Tools", Boolean, false);


			function getPossibleSides(pos) {
				for(const side of EnumFacing.VALUES) {
					const state = game$1.world.getBlockState(pos.add(side.toVector().x, side.toVector().y, side.toVector().z));
					if (state.getBlock().material != Materials.air) return side.getOpposite();
				}
			}

			function switchSlot(slot) {
				player$1.inventory.currentItem = slot;
				game$1.info.selectedSlot = slot;
			}

			let scaffoldtower, oldHeld;
			const scaffold = new Module("Scaffold", function(callback) {
				if (callback) {
					if (player$1) oldHeld = game$1.info.selectedSlot;
					tickLoop["Scaffold"] = function() {
						for(let i = 0; i < 9; i++) {
							const item = player$1.inventory.main[i];
							if (item && item.item instanceof ItemBlock && item.item.block.getBoundingBox().max.y == 1 && item.item.name != "tnt") {
								switchSlot(i);
								break;
							}
						}

						const item = player$1.inventory.getCurrentItem();
						if (item && item.getItem() instanceof ItemBlock) {
							let placeSide;
							let pos = new BlockPos(player$1.pos.x, player$1.pos.y - 1, player$1.pos.z);
							if (game$1.world.getBlockState(pos).getBlock().material == Materials.air) {
								placeSide = getPossibleSides(pos);
								if (!placeSide) {
									let closestSide, closestPos;
									let closest = 999;
									for(let x = -5; x < 5; ++x) {
										for (let z = -5; z < 5; ++z) {
											const newPos = new BlockPos(pos.x + x, pos.y, pos.z + z);
											const checkNearby = getPossibleSides(newPos);
											if (checkNearby) {
												const newDist = player$1.pos.distanceTo(new Vector3$1(newPos.x, newPos.y, newPos.z));
												if (newDist <= closest) {
													closest = newDist;
													closestSide = checkNearby;
													closestPos = newPos;
												}
											}
										}
									}

									if (closestPos) {
										pos = closestPos;
										placeSide = closestSide;
									}
								}
							}

							if (placeSide) {
								const dir = placeSide.getOpposite().toVector();
								const newDir = placeSide.toVector();
								const placePosition = new BlockPos(pos.x + dir.x, pos.y + dir.y, pos.z + dir.z);
								const hitVec = new Vector3$1(placePosition.x + (newDir.x != 0 ? Math.max(newDir.x, 0) : Math.random()), placePosition.y + (newDir.y != 0 ? Math.max(newDir.y, 0) : Math.random()), placePosition.z + (newDir.z != 0 ? Math.max(newDir.z, 0) : Math.random()));
								if (scaffoldtower[1] && keyPressedDump("space") && dir.y == -1 && player$1.motion.y < 0.2 && player$1.motion.y > 0.15) player$1.motion.y = 0.42;
								if (playerControllerDump.onPlayerRightClick(player$1, game$1.world, item, placePosition, placeSide, hitVec)) hud3D.swingArm();
								if (item.stackSize == 0) {
									player$1.inventory.main[player$1.inventory.currentItem] = null;
									return;
								}
							}
						}
					}
				}
				else {
					if (player$1 && oldHeld != undefined) switchSlot(oldHeld);
					delete tickLoop["Scaffold"];
				}
			});
			scaffoldtower = scaffold.addoption("Tower", Boolean, true);

			function reloadTickLoop(value) {
				if (game$1.tickLoop) {
					MSPT = value;
					clearInterval(game$1.tickLoop);
					game$1.tickLoop = setInterval(() => game$1.fixedUpdate(), MSPT);
				}
			}

			let timervalue;
			const timer = new Module("Timer", function(callback) {
				reloadTickLoop(callback ? 50 / timervalue[1] : 50);
			});
			timervalue = timer.addoption("Value", Number, 1.2);
			new Module("Phase", function() {});

			const antiban = new Module("AntiBan", function() {});
			antiban.toggle();
			new Module("AutoRejoin", function() {});
			new Module("AutoQueue", function() {});
			new Module("AutoVote", function() {});
			const chatdisabler = new Module("ChatDisabler", function() {});
			chatdisablermsg = chatdisabler.addoption("Message", String, "youtube.com/c/7GrandDadVape");
			new Module("FilterBypass", function() {});

			const survival = new Module("SurvivalMode", function(callback) {
				if (callback) {
					if (player$1) player$1.setGamemode(GameMode.fromId("survival"));
					survival.toggle();
				}
			});

			globalThis.${storeName}.modules = modules;
			globalThis.${storeName}.profile = "default";
		})();
	`);

	async function saveVapeConfig(profile) {
		if (!loadedConfig) return;
		let saveList = {};
		for(const [name, module] of Object.entries(unsafeWindow.globalThis[storeName].modules)) {
			saveList[name] = {enabled: module.enabled, bind: module.bind, options: {}};
			for(const [option, setting] of Object.entries(module.options)) {
				saveList[name].options[option] = setting[1];
			}
		}
		GM_setValue("vapeConfig" + (profile ?? unsafeWindow.globalThis[storeName].profile), JSON.stringify(saveList));
		GM_setValue("mainVapeConfig", JSON.stringify({profile: unsafeWindow.globalThis[storeName].profile}));
	};

	async function loadVapeConfig(switched) {
		loadedConfig = false;
		const loadedMain = JSON.parse(await GM_getValue("mainVapeConfig", "{}")) ?? {profile: "default"};
		unsafeWindow.globalThis[storeName].profile = switched ?? loadedMain.profile;
		const loaded = JSON.parse(await GM_getValue("vapeConfig" + unsafeWindow.globalThis[storeName].profile, "{}"));
		if (!loaded) {
			loadedConfig = true;
			return;
		}

		for(const [name, module] of Object.entries(loaded)) {
			const realModule = unsafeWindow.globalThis[storeName].modules[name];
			if (!realModule) continue;
			if (realModule.enabled != module.enabled) realModule.toggle();
			if (realModule.bind != module.bind) realModule.setbind(module.bind);
			if (module.options) {
				for(const [option, setting] of Object.entries(module.options)) {
					const realOption = realModule.options[option];
					if (!realOption) continue;
					realOption[1] = setting;
				}
			}
		}
		loadedConfig = true;
	};

	async function exportVapeConfig() {
		navigator.clipboard.writeText(await GM_getValue("vapeConfig" + unsafeWindow.globalThis[storeName].profile, "{}"));
	};

	async function importVapeConfig() {
		const arg = await navigator.clipboard.readText();
		if (!arg) return;
		GM_setValue("vapeConfig" + unsafeWindow.globalThis[storeName].profile, arg);
		loadVapeConfig();
	};

	let loadedConfig = false;
	async function execute(src, oldScript) {
		Object.defineProperty(unsafeWindow.globalThis, storeName, {value: {}, enumerable: false});
		if (oldScript) oldScript.type = 'javascript/blocked';
		await fetch(src).then(e => e.text()).then(e => modifyCode(e));
		if (oldScript) oldScript.type = 'module';
		await new Promise((resolve) => {
			const loop = setInterval(async function() {
				if (unsafeWindow.globalThis[storeName].modules) {
					clearInterval(loop);
					resolve();
				}
			}, 10);
		});
		unsafeWindow.globalThis[storeName].saveVapeConfig = saveVapeConfig;
		unsafeWindow.globalThis[storeName].loadVapeConfig = loadVapeConfig;
		unsafeWindow.globalThis[storeName].exportVapeConfig = exportVapeConfig;
		unsafeWindow.globalThis[storeName].importVapeConfig = importVapeConfig;
		loadVapeConfig();
		setInterval(async function() {
			saveVapeConfig();
		}, 10000);
	}

	const publicUrl = "scripturl";
	// https://stackoverflow.com/questions/22141205/intercept-and-alter-a-sites-javascript-using-greasemonkey
	if (publicUrl == "scripturl") {
		if (navigator.userAgent.indexOf("Firefox") != -1) {
			window.addEventListener("beforescriptexecute", function(e) {
				if (e.target.src.includes("https://miniblox.io/assets/index")) {
					e.preventDefault();
					e.stopPropagation();
					execute(e.target.src);
				}
			}, false);
		}
		else {
			new MutationObserver(async (mutations, observer) => {
				let oldScript = mutations
					.flatMap(e => [...e.addedNodes])
					.filter(e => e.tagName == 'SCRIPT')
					.find(e => e.src.includes("https://miniblox.io/assets/index"));

				if (oldScript) {
					observer.disconnect();
					execute(oldScript.src, oldScript);
				}
			}).observe(document, {
				childList: true,
				subtree: true,
			});
		}
	}
	else {
		execute(publicUrl);
	}
})();
