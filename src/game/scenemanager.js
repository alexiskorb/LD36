
Input = require("../sdk/input");
Conversation = require("./conversation.js");
InfoBox = require("./infobox.js");
AudioManager = require("../sdk/audiomanager");
//SaveState = require("./save_state.js")

var SceneManager =
{
	/**
	 * List of all possible scenes in the game.
	 * In order of input priority.
	 */
	scenes:
	{
		timeDevice: require("./scene_timedevice.js"),
		prison0: require("./scene_index.js"),
		creationOfTheWorld: require("./scene_creation_of_the_world.js"),
		field: require("./scene_past_field.js"),
		construction: require("./scene_past_construction.js"),
		prison1: require("./scene_prison1.js"),
		prison2: require("./scene_prison2.js"),
		prison3: require("./scene_prison3.js"),
		prison4: require("./scene_prison4.js"),
		prison5: require("./scene_prison5.js"),
		prison6: require("./scene_prison6.js"),
		prison7: require("./scene_prison7.js"),
		prison8: require("./scene_prison8.js"),
		win: require("./scene_win.js"),
		LAST_PRISON: undefined, //special case, set dynamically
	},

	currentScene: undefined,
	lastHoveredTarget: undefined,

	animation: undefined,
}

SceneManager.ANIM_NONE = 0;
SceneManager.ANIM_TIMETRAVEL = 1;
SceneManager.ANIM_FORWARD = 2;

module.exports = SceneManager;

SceneManager.added = function()
{
	// initialize all scenes
	for (var key in this.scenes)
	{
		if (this.scenes[key])
		{
			this.scenes[key].added();
		}
	}
	this.scenes.LAST_PRISON = this.scenes.prison0;

	// add timedevice scene by default
	this.scenes["timeDevice"].show();
	this.scenes["timeDevice"].transform.position.z = -10;

	var music = AudioManager.playSound("media/ngxmusicalngx+astrangedream.mp3");
	music.loop = true;

	this.debugChangeScene("prison0");
}

SceneManager.update = function()
{
	var clickTarget = undefined;
	for (var i in this.scenes)
	{
		if (this.scenes[i].enabled)
		{
			clickTarget = this.scenes[i].getClickTarget(GameEngine.mousePosWorld);
		}
		if (clickTarget) break;
	}

	if (!Conversation.isConversationActive() && !this.animation)
	{
		if (clickTarget)
		{
			if (Input.Mouse.buttonPressed(Input.Mouse.LEFT))
			{
				clickTarget.trigger();
			}
		}
	}

	if (clickTarget != this.lastHoveredTarget)
	{
		if (clickTarget) clickTarget.hover();
		if (this.lastHoveredTarget) this.lastHoveredTarget.unhover();
	}

	this.lastHoveredTarget = clickTarget;

	// update animation
	if (this.animation)
	{
		this.animationTimer += bmacSdk.deltaSec;
		if (this.animationTimer >= this.animationDuration)
		{
			this.animationTimer = this.animationDuration;
			this.animation = undefined;
			this.finallyChangeScene(this.changingToScene);
		}

		var animProgress = this.animationTimer / this.animationDuration;

		// ease in
		animProgress = animProgress * animProgress * animProgress;

		switch (this.animation)
		{
			case SceneManager.ANIM_FORWARD:
			// scale up and fade out
			this.currentScene.transform.scale.set(1 + animProgress * 1.5, 1 + animProgress * 1.5, 1);
			this.currentScene.setAlpha(1 - (animProgress * animProgress));
			break;
		}
	}

	if (Input.Mouse.buttonPressed(Input.Mouse.LEFT))
	{
		//TODO: hide if clicking a different target
		if (!(clickTarget)) 
		{
			InfoBox.hide();
		}
		Inventory.deselect();
	}

	for (var i in this.scenes)
	{
		if (this.scenes[i].enabled)
		{
			this.scenes[i].update();
		}
	}
}

SceneManager.showTimeDevice = function()
{
	this.scenes.timeDevice.tweenOn();
}

/**
 * Changes the scene the one with the specified key.
 * @param {String} key
 */
SceneManager.changeScene = function(key, animType)
{
	var credits = document.getElementById("credits");
	credits.style.visibility = "hidden";

	if (!this.scenes[key])
	{
		console.error("No scene found with key '" + key + "'.");
		return;
	}

	// can't change to the current scene
	if (this.scenes[key] === this.currentScene)
	{
		return;
	}

	var targetScene = this.scenes[key];
	this.showScene(targetScene);
	targetScene.transform.position.z = -70;
	this.changingToScene = key;
	
	this.animation = animType;
	this.animationTimer = 0;
	switch (animType)
	{
		case SceneManager.ANIM_NONE:
		this.animationDuration = 0;
		break;
		case SceneManager.ANIM_FORWARD:
		this.animationDuration = 2;
		break;
		case SceneManager.ANIM_TIMETRAVEL:
		this.animationDuration = 0;
		break;
	}
}

SceneManager.finallyChangeScene = function(key, dontNotify)
{
	if (this.currentScene)
	{
		this.currentScene.hide();
	}

	// swap music
	if (!this.currentScene || this.currentScene.musicUrl != this.scenes[key].musicUrl)
	{
		//TODO:
	}

	this.currentScene = this.scenes[key];
	this.currentScene.transform.position.z = -45;
	if (!dontNotify)
	{
		for (var i in this.scenes)
		{
			this.scenes[i].notifyChangedScene();
		}
	}

	if (key.substr(0, 6) === "prison")
	{
		//SaveSate.setGlobal("prison", this.scenes.LAST_PRISON);
		this.scenes.LAST_PRISON = this.currentScene;
	}
}

SceneManager.debugChangeScene = function(key)
{
	this.finallyChangeScene(key, true);
	this.showScene(this.currentScene);
}

SceneManager.showScene = function(scene)
{
	scene.show();
	scene.transform.scale.set(1,1,1);
	scene.setAlpha(1);
}
