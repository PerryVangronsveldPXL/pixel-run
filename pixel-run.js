kaboom({
  global: true,
  fullscreen: true,
  scale: 2,
  debug: true,
  clearColor: [0, 0, 0, 1],
});

// Constants
const JUMP_FORCE = 330;
const ENEMY_JUMP_FORCE = 150;
const MOVE_SPEED = 120;
const ENEMY_SPEED = 140;
const FALL_DEATH = 1000;

let isJumping = false;

// Sprites
loadRoot("./sprites/");
loadSprite("floor", "floor.png");
loadSprite("dirt", "dirt.png");
loadSprite("stone", "stone.png");
loadSprite("miso", "miso.png");
loadSprite("miso-flipped", "miso-flipped.png");
loadSprite("pixel", "pixel.png");
loadSprite("pixel-flipped", "pixel-flipped.png");
loadSprite("snack", "snack.png");
loadSprite("pipe-top-left", "pipe-top-left.png");
loadSprite("pipe-top-right", "pipe-top-right.png");
loadSprite("pipe-bottom-left", "pipe-bottom-left.png");
loadSprite("pipe-bottom-right", "pipe-bottom-right.png");

// Start Screen
scene("start", () => {
  add([
    text("Pixel Run", 32),
    origin("center"),
    pos(width() / 2, height() / 3),
  ]);
  add([
    text(
      "You're Miso the cat and you're hungry for some cat snacks.\nCollect all 8 snacks to win.\n\nBut beware, because Pixel The White Menace is coming for you!\nIf she catches you," +
        " you lose!",
      9
    ),
    origin("center"),
    pos(width() / 2, height() / 2),
  ]);
  add([
    text("Press space to continue", 9),
    origin("center"),
    pos(width() / 2, height() / 1.5),
  ]);

  keyPress("space", () => {
    go("main");
  });
});

// Game Over Screens
scene("lose", () => {
  add([
    text("Pixel got you!", 32),
    origin("center"),
    pos(width() / 2, height() / 2),
  ]);
  add([
    text("Press space to try again", 9),
    origin("center"),
    pos(width() / 2, height() / 1.5),
  ]);
  keyPress("space", () => {
    go("main");
  });
});

scene("fall-death", () => {
  add([
    text("You fell!", 32),
    origin("center"),
    pos(width() / 2, height() / 2),
  ]);
  add([
    text("Press space to try again", 9),
    origin("center"),
    pos(width() / 2, height() / 1.5),
  ]);
  keyPress("space", () => {
    go("main");
  });
});

// Win Screen
scene("win", () => {
  add([text("You won!", 32), origin("center"), pos(width() / 2, height() / 3)]);
  add([
    text("Now go enjoy your snacks!", 16),
    origin("center"),
    pos(width() / 2, height() / 2),
  ]);
  add([
    text("Press space to play again", 9),
    origin("center"),
    pos(width() / 2, height() / 1.5),
  ]);
  keyPress("space", () => {
    go("main");
  });
});

// Main Game

// Level
scene("main", () => {
  layers(["bg", "obj", "ui"], "obj");
  let score = 0;
  let scoreLabel = add([
    text(`Score: ${score}/8`),
    pos(30, 6),
    layer("ui"),
    { value: score },
  ]);

  const map = [
    "       %           %                                %",
    "                                                     ",
    "                                 !                   ",
    "===========      ==============================      ",
    "                                                    .",
    "                                                   ..",
    "                                                  ...",
    "                                  %              ....",
    " %                                            .......",
    "                                             ........",
    "                   --            ---        .........",
    "===========================    =======    ===========",
    "                                                     ",
    "                                                     ",
    "        %                                            ",
    "                                                 %   ",
    "     .......                                         ",
    ".                                 %                  ",
    "..                                               +|  ",
    "...                                              ()  ",
    "=====================================================",
    "                                                     ",
    "                                                     ",
    "                                                     ",
  ];

  const levelConfig = {
    width: 20,
    height: 20,
    "=": [sprite("floor"), solid()],
    "-": [sprite("dirt"), solid(), "dirt"],
    "!": [sprite("pixel-flipped"), body(), scale(0.1), "enemy"],
    ".": [sprite("stone"), solid(), "stone"],
    "%": [sprite("snack"), scale(0.25), "snack", rotate(100), origin("center")],
    "(": [sprite("pipe-bottom-left"), solid(), scale(0.5), "pipe-bottom"],
    ")": [sprite("pipe-bottom-right"), solid(), scale(0.5), "pipe-bottom"],
    "+": [sprite("pipe-top-left"), solid(), scale(0.5), "pipe"],
    "|": [sprite("pipe-top-right"), solid(), scale(0.5), "pipe"],
  };

  const gameLevel = addLevel(map, levelConfig);

  // Music
  let theme = new Audio("./music/music.mp3");
  theme.volume = 0.4;
  theme.loop = true;
  theme.play();
  let eatSound = new Audio("./music/eat.wav");
  eatSound.volume = 0.1;
  let jumpSound = new Audio("./music/jump.mp3");
  jumpSound.volume = 0.12;

  // Player
  let player = add([
    sprite("miso"),
    scale(0.1),
    body(),
    pos(30, 0),
    origin("bot"),
  ]);

  // Player Movements
  keyDown("left", () => {
    player.changeSprite("miso-flipped");
    player.move(-MOVE_SPEED, 0);
  });

  keyDown("right", () => {
    player.changeSprite("miso");
    player.move(MOVE_SPEED, 0);
  });

  keyPress("space", () => {
    if (player.grounded()) {
      isJumping = true;
      player.jump(JUMP_FORCE);
      jumpSound.play();
    }
  });

  // Player Actions

  player.collides("pipe", () => {
    keyPress("down", () => {
      player.pos = vec2(30, 0);
    });
  });

  player.collides("enemy", () => {
    theme.pause();
    theme.currentTime = 0;
    go("lose");
  });

  player.collides("snack", (s) => {
    destroy(s);
    eatSound.play();
    score += 1;
    scoreLabel.text = `Score: ${score}/8`;
    if (score === 8) {
      theme.pause();
      theme.currentTime = 0;
      go("win");
    }
  });

  player.action(() => {
    if (player.grounded()) {
      isJumping = false;
    }
  });

  player.action(() => {
    camPos(player.pos);
    if (player.pos.y >= FALL_DEATH) {
      theme.pause();
      theme.currentTime = 0;
      go("fall-death");
    }
  });

  // Other Actions
  action("snack", (s) => {
    s.angle += dt();
  });

  action("enemy", (e) => {
    const dir = player.pos.sub(e.pos).unit();
    e.move(dir.scale(ENEMY_SPEED));
  });

  action("enemy", (e) => {
    if (isJumping) {
      e.jump(ENEMY_JUMP_FORCE);
      wait(0.15, () => {
        isJumping = false;
      });
    }
  });

  action("enemy", (e) => {
    if (e.pos.x < player.pos.x) {
      e.changeSprite("pixel");
    } else {
      e.changeSprite("pixel-flipped");
    }
  });

  collides("enemy", "dirt", (e, d) => {
    e.jump(ENEMY_JUMP_FORCE);
  });

  collides("enemy", "stone", (e, s) => {
    e.jump(ENEMY_JUMP_FORCE);
  });

  collides("enemy", "pipe-bottom", (e, p) => {
    e.jump(ENEMY_JUMP_FORCE);
  });
});

start("start");
