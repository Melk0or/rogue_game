//класс Sound для создания звуков
class Sound {
  constructor(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
  }
  play() {
    this.sound.play();
  }
  stop() {
    this.sound.pause();
  }
}



class Entity {
  static arrOfCoordinateEntity = [];
  constructor(type) {
    this.type = type;
    this.health = 100; // начальное здоровье
    this.isAlive = true;
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) this.isAlive = false;
  }
  //проверка на возможность движения в заданом направлении
  canMoveTo(newX, newY, tiles, typeOfEntity) {
    //если конец зоны - возвращаем false
    if (!(tiles[newY] && tiles[newY][newX])) return false;
    //если вызов для игрока - возвращаем true в случае если это не стена или враг
    if (typeOfEntity === "player") {
      return tiles[newY][newX] !== "wall" && tiles[newY][newX] !== "Enemy";
    }
    //в остальным случаях возвращаем true - если это пол
    return tiles[newY][newX] === "ground";

  }
}

class Player extends Entity {
  static attackPower = 10; // сила атаки игрока
  constructor() {
    super("player");
  }
  //грейды от зелий и мечей
  lifelessGrade(y, x, tiles) {
    //если данное поле - банка зелья - восстанавливаем хп, в другом случае увлеличиваем урон плеера
    if (tiles[y][x] === "HP") {
      this.health =
        this.health + Potion.healingPower > 100
          ? 100
          : this.health + Potion.healingPower;
    } else if (tiles[y][x] === "SW") {
      Player.attackPower += Sword.attackBonus;
    }
  }
  //обработчка удара по врагу
  enemyHit(gameMap, enemy, nearby, j) {
    // отнимаем хп у противника и в случае достижения нуля полосы здоровья - убиваем его
    if (enemy) {
      //следующая строка нужна для следующего перерендера
      enemy.health -= Player.attackPower;
      if (
          parseInt(nearby[j].children[0].style.width.slice(0, -1)) <= 0
      ) {
        gameMap.tiles[enemy.y][enemy.x] = "ground";
        nearby[j].className = "tile";
        enemy.health = 0;
        enemy.isAlive = false;
      }
    }
  }
  //функция для атаки игрока
  attack(gameMap, player, enemies, keyProp) {
    //Проверка на нахождение в области кусь
    // const isNextToPlayer =
    //   tiles[this.y - 1][this.x] === "Enemy" ||
    //   tiles[this.y + 1][this.x] === "Enemy" ||
    //   tiles[this.y][this.x - 1] === "Enemy" ||
    //   tiles[this.y][this.x + 1] === "Enemy" ||
    //   tiles[this.y - 1][this.x - 1] === "Enemy" ||
    //   tiles[this.y + 1][this.x - 1] === "Enemy" ||
    //   tiles[this.y - 1][this.x + 1] === "Enemy" ||
    //   tiles[this.y + 1][this.x + 1] === "Enemy";
    // if (isNextToPlayer) {
    //   console.log("BAM");
    // }
    const box = document.querySelector(".field");
    for (
        let i = 0;
        i < box.children.length;
        i++
    ) {
      //Если нашелся плеер в контейнере
      if (
          box.children[i] ===
          document.querySelector(".tileP")
      ) {
        //собираем массив из соседних клеток и устанавливаем в их аттрибут их позицию в контейнере
        const [tile1, tile2, tile3, tile4, tile5, tile6, tile7, tile8] = [
          box.children[i - 40],
          box.children[i + 40],
          box.children[i - 1],
          box.children[i + 1],
          box.children[i - 39],
          box.children[i - 41],
          box.children[i + 39],
          box.children[i + 41],
        ];
        tile1?.setAttribute("data", i - 40);
        tile2?.setAttribute("data", i + 40);
        tile3?.setAttribute("data", i - 1);
        tile4?.setAttribute("data", i + 1);
        tile5?.setAttribute("data", i - 39);
        tile6?.setAttribute("data", i - 41);
        tile7?.setAttribute("data", i + 39);
        tile8?.setAttribute("data", i + 41);
        //проверяем массив на наличие пустыъ клеток и фильтруем
        const nearby = [
          tile1,
          tile2,
          tile3,
          tile4,
          tile5,
          tile6,
          tile7,
          tile8,
        ].filter(item => item);
        for (let j = 0; j < nearby.length; j++) {
          //проходимся по массиву соседних клеток в поиске врага
          if (nearby[j].className === "tileE") {
            //УРон по игроку------------
            const playerHealBar =
                document.querySelector(".tileP").children[0];
            //при перерисовке дерева стили не сохраняются - придется выкрчиваться так
            if (!playerHealBar.style.width)
              playerHealBar.style.width = "100%";
            //отнимаем хп и в случае нуля - убиваем игрока
            player.health -= Enemy.attackPower;
            if (player.health <= 0) {
              playerHealBar.style.width = "0%";
              player.health = 0;
              player.isAlive = false;
              const soundOfLose = new Sound("images/lose.mp3");
              document.removeEventListener("keydown", keyProp);
              soundOfLose.play();
              document.querySelector(".tileP").className = "tile";
            } else {
              playerHealBar.style.width = `${player.health}%`;
            }
            //-----------------------
            //Урон по противникам--------
            if (!nearby[j].children[0].style.width) {
              nearby[j].children[0].style.width = "100%";
            }
            //вычитаем их хиллбара противника урон игрока и устанавливаем ширину этого хилбара
            const difference =
                parseInt(nearby[j].children[0].style.width.slice(0, -1)) -
                Player.attackPower;
            nearby[j].children[0].style.width =
                difference < 0 ? "0%" : `${difference}%`;
            //нахождение координат объекта врага на карте впутем выведенной формулы:
            // для х - (40 - (положение врага) * 40 - (положение врага)) - тем самым узнаем столбец расположения врага,
            // для у - ((положение врага) / 40 - 1 - тем самым узнаем строку расположения врага
            const enemy = enemies.find(
                (enemy) =>
                    enemy.x ===
                    40 -
                    (Math.ceil(nearby[j].getAttribute("data") / 40) * 40 -
                        nearby[j].getAttribute("data")) &&
                    enemy.y ===
                    Math.ceil(nearby[j].getAttribute("data") / 40) - 1
            );
            this.enemyHit(gameMap, enemy, nearby, j);
            //проверка единственного исключения - правого края игровой зоны.
            if(!enemy) {
              const enemy = enemies.find(
                  (enemy) =>
                      enemy.x ===
                      (Math.ceil(nearby[j].getAttribute("data") / 40) * 40 -
                          nearby[j].getAttribute("data")) &&
                      enemy.y ===
                      Math.ceil(nearby[j].getAttribute("data") / 40)
              );
              this.enemyHit(gameMap, enemy, nearby, j);
            }

          }
        }
      }
    }
  }

  move(direction, tiles) {
    //обработка нажатия клавиши
    switch (direction) {
      case "w":
        if (this.canMoveTo(this.x, this.y - 1, tiles, this.type)) {
          this.lifelessGrade(this.y - 1, this.x, tiles);
          tiles[this.y][this.x] = "ground";
          this.y -= 1;
          tiles[this.y][this.x] = "Player";
        }
        break;
      case "a":
        if (this.canMoveTo(this.x - 1, this.y, tiles, this.type)) {
          this.lifelessGrade(this.y, this.x - 1, tiles);
          tiles[this.y][this.x] = "ground";
          this.x -= 1;
          tiles[this.y][this.x] = "Player";
        }
        break;
      case "d":
        if (this.canMoveTo(this.x + 1, this.y, tiles, this.type)) {
          this.lifelessGrade(this.y, this.x + 1, tiles);
          tiles[this.y][this.x] = "ground";
          this.x += 1;
          tiles[this.y][this.x] = "Player";
        }
        break;
      case "s":
        if (this.canMoveTo(this.x, this.y + 1, tiles, this.type)) {
          this.lifelessGrade(this.y + 1, this.x, tiles);
          tiles[this.y][this.x] = "ground";
          this.y += 1;
          tiles[this.y][this.x] = "Player";
        }
        break;
    }
  }
}

class Enemy extends Entity {
  static enemies = [];
  static attackPower = 5; // сила атаки противника
  constructor() {
    super("enemy");
    this.way = Math.random() > 0.5 ? "vertical" : "horizontal";
    this.direction =
      this.way === "vertical"
        ? Math.random() > 0.5
          ? "up"
          : "down"
        : Math.random() > 0.5
        ? "right"
        : "left"; // начальное направление движения выбирается рандомно
  }
  moveRandom(tiles) {
    let newY, newX
    //если вертикальное движение
    if (this.way === "vertical") {
      //В зависимости от направления по оси y - формируем новые координаты для объекта
      newY = this.direction === "up" ? this.y - 1 : this.y + 1;
      newX = this.x;
      //Проверяем на возможность движения и переприсваиваем поля нашей карты: на старую позицию устанавливаем пол - на новую наш объекь
      if (this.canMoveTo(newX, newY, tiles, this.type)) {
        tiles[this.y][this.x] = "ground";
        this.y = newY;
        tiles[this.y][this.x] = "Enemy";
      } else {
        // Если столкнулись со стеной, развернуться
        this.direction = this.direction === "up" ? "down" : "up";
      }
    }
    //Если горизонтальное и для него такая же структура как для вертикального
    else {
      newY = this.y;
      newX = this.direction === "left" ? this.x - 1 : this.x + 1;
      if (this.canMoveTo(newX, newY, tiles, this.type)) {
        tiles[this.y][this.x] = "ground";
        this.x = newX;
        tiles[this.y][this.x] = "Enemy";
      } else {
        // Если столкнулись со стеной, развернуться
        this.direction = this.direction === "left" ? "right" : "left";
      }
    }
  }

}

class Sword extends Entity {
  static attackBonus = 15; // бонус к силе атаки при подборе меча
  constructor() {
    super("sword");
  }
}

class Potion extends Entity {
  static healingPower = 20; // сила лечения при подборе зелья
  constructor() {
    super("potion");
  }
}

class Scene {
  static arrOfTile = []; //массив свободных клеток
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = Array.from({ length: height }, () =>
      Array(width).fill("wall")
    ); // заполняем нашу карту стеной
  }

  generateRoomsAndPaths() {
    //Генерация комнат рандомно на основе условий из ТЗ
    //от 5 до 10 комнаты
    for (let i = 0; i < Math.round(Math.random() * 5) + 5; i++) {
      //выбираем рандомную координату на карте в пределах от 0 до 3 с конца
      const [controlPointH, controlPointW] = [
        Math.round(Math.random() * (this.height - 3)),
        Math.round(Math.random() * (this.width - 3)),
      ];
      //формируем высоту комнаты рандомно от 3 до 8
      const heightOfRoom = Math.round(Math.random() * 5) + 3;
      //формируем  ширину комнаты от 3 до 8
      const widthOfRoom = Math.round(Math.random() * 5) + 3;
      for (let j = 0; j < widthOfRoom; j++) {
        for (let k = 0; k < heightOfRoom; k++) {
          //если клетка существует - делаем из нее пол
          if (this.tiles[controlPointH + k]) {
            this.tiles[controlPointH + k][controlPointW + j] = "ground";
            //пушим координаты в массив свободных клеток
            Scene.arrOfTile.push([controlPointH + k, controlPointW + j]);
          }
        }
      }
    }
    //------------------------------
    //Генерация путей
    //от 3 до 5 путей
    for (let i = 0; i < Math.round(Math.random() * 2) + 3; i++) {
      //выбираем рандомные координаты на карте
      const [controlPointH, controlPointW] = [
        Math.round(Math.random() * (this.height - 3) + 1),
        Math.round(Math.random() * (this.width - 3) + 1),
      ];
      // формируем вертикальную линиую
      for (let j = 0; j < 24; j++) {
        this.tiles[j][controlPointW] = "ground";
        //пушим координаты в массив свободных клеток
        Scene.arrOfTile.push([j, controlPointW]);
      }
      //формируем горзонтальную линию
      for (let j = 0; j < 40; j++) {
        this.tiles[controlPointH][j] = "ground";
        //пушим координаты в массив свободных клеток
        Scene.arrOfTile.push([controlPointH, j]);
      }
    }
  }
  //Расположить сущность
  placeEntity(entity) {
    //Выбираем рандомную точку в массиве свободных клеток
    let randomPlace = Math.round(Math.random() * Scene.arrOfTile.length - 1);
    let [y, x] = [
      Scene.arrOfTile[randomPlace][0],
      Scene.arrOfTile[randomPlace][1],
    ];
    //если в массиве координат сущностей есть такой прикол с нашими координатами - переопределяем координаты таким же методом
    while (
      Entity.arrOfCoordinateEntity.find(
        (item) => item[0] === y && item[1] === x
      )
    ) {
      randomPlace = Math.round(Math.random() * Scene.arrOfTile.length - 1);
      [y, x] = [
        Scene.arrOfTile[randomPlace][0],
        Scene.arrOfTile[randomPlace][1],
      ];
    }
    //устанвливаем координаты для нашей сущности
    entity.x = x;
    entity.y = y;
    //пушим ее координаты в массив координат сущностей
    Entity.arrOfCoordinateEntity.push([y, x]);
    //в зависимости от типа нашей сущности меняем поле на карте
    switch (entity.type) {
      case "potion":
        this.tiles[y][x] = "HP";
        break;
      case "sword":
        this.tiles[y][x] = "SW";
        break;
      case "player":
        this.tiles[y][x] = "Player";
        break;
      case "enemy":
        this.tiles[y][x] = "Enemy";
        break;
      default:
        break;
    }
  }

  //генерация сущности
  generateEntity(tiles, box, player, i, j) {
    //создаем новое поле
    const newTileW = document.createElement("div");
    //в зависимости от значения поля карты генерируем класс
    switch (tiles[i][j]) {
      case "wall":
        newTileW.className = "tileW";
        break;
      case "ground":
        newTileW.className = "tile";
        break;
      case "HP":
        newTileW.className = "tileHP";
        break;
      case "SW":
        newTileW.className = "tileSW";
        break;
      case "Player":
        newTileW.className = "tileP";
        const healthP = document.createElement("span");
        healthP.className = "health";
        //если мы задали плеера  - формируем хиллбар зависящий от нынешнего его хп
        if (player) healthP.style.width = `${player.health}%`;
        newTileW.appendChild(healthP);
        break;
      case "Enemy":
        newTileW.className = "tileE";
        const healthE = document.createElement("span");
        healthE.className = "health";
        //если в нашем массиве врагов есть чувак с такими координатами - устанавливаем ему хиллбар зависяший от его хп
        const findEnemy = Enemy.enemies.find(
          (enemy) => enemy.y === i && enemy.x === j
        );
        if (findEnemy) healthE.style.width = `${findEnemy.health}%`;
        newTileW.appendChild(healthE);
        // );
        break;
      default:
        break;
    }
    box.appendChild(newTileW);
  }

  // rerender(tiles, player) {
  //       for (let j = 0; j <  this.height; j++) {
  //       for (let k = 0; k < this.width; k++) {
  //         const newTileW = document.querySelector('.field').children[j + k];
  //         switch (tiles[j][k]) {
  //           case "wall":
  //             newTileW.className = "tileW";
  //             break;
  //           case "ground":
  //             newTileW.className = "tile";
  //             break;
  //           case "HP":
  //             newTileW.className = "tileHP";
  //             break;
  //           case "SW":
  //             newTileW.className = "tileSW";
  //             break;
  //           case "Player":
  //             newTileW.className = "tileP";
  //             const healthP = newTileW.children[0];
  //             healthP.className = "health";
  //             //если мы задали плеера  - формируем хиллбар зависящий от нынешнего его хп
  //             if (player) healthP.style.width = `${player.health}%`;
  //             break;
  //           case "Enemy":
  //             newTileW.className = "tileE";
  //             const healthE = newTileW.children[0];
  //             healthE.className = "health";
  //             //если в нашем массиве врагов есть чувак с такими координатами - устанавливаем ему хиллбар зависяший от его хп
  //             const findEnemy = Enemy.enemies.find(
  //                 (enemy) => enemy.y === j && enemy.x === k
  //             );
  //             if (findEnemy) healthE.style.width = `${findEnemy.health}%`;
  //             // );
  //             break;
  //           default:
  //             break;
  //         }
  //       }
  //     }
  // }

  render(player) {
    const box = document.querySelector(".field");
    //если карта уже существует - не генерируем
    if (box.children.length === 960) return;
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        this.generateEntity(this.tiles, box, player, i, j);
      }
      this.tiles[i].length = 40;
    }
  }
}

window.addEventListener("DOMContentLoaded", function () {
  const gameMap = new Scene(40, 24);
  gameMap.generateRoomsAndPaths();
  // наши сущности
  const player = new Player();
  const enemies = Array.from(
    { length: 10 },
    () => new Enemy()
  );
  const swords = Array.from(
    { length: 2 },
    () => new Sword()
  );
  const potions = Array.from(
    { length: 10 },
    () => new Potion()
  );
  function keyProp(e) {
    handleKeyPress(e.key);
  }




  //обработик нажатия клавиши
  document.addEventListener("keydown", keyProp);
  function handleKeyPress(key) {
    if (
      key === "w" ||
      key === "a" ||
      key === "d" ||
      key === "s" ||
      key === " "
    ) {
      //если пробел - удар
      if (key === " ") {
        //звук меча
        const soundHit = new Sound('images/sword.wav');
        //обработка атаки
        player.attack(gameMap, player, enemies, keyProp);
        soundHit.play();

      }
      //Иначе движение
      else {
        //Движение игрока
        player.move(key, gameMap.tiles);
        //Подсчет врагов
        let count = 0;
        //для каждого врага - движение и проверка на бытие
        enemies.forEach((item) => {
          if (item.isAlive) {
            item.moveRandom(gameMap.tiles);
            count++;
          }
        });
        //запускаем перерендер
        document.querySelector(".field").replaceChildren();
        //если счетчик врагов равен нулю - следующий ход победа
        if (count === 0)  {
          //звук победы
          const soundWin = new Sound("images/win.mp3");
          document.removeEventListener("keydown", keyProp);
          soundWin.play();
        }
      }
      //функция рендер с сетТаймаутом для того, чтобы выполнился в последнюю очередь
      setTimeout(() => gameMap.render(player));
    }
  }

  setTimeout(() => {
    //расположение всех сущностей
    gameMap.placeEntity(player);
    enemies.forEach(async (enemy) => {
      await gameMap.placeEntity(enemy);
      Enemy.enemies.push(enemy);
    });
    swords.forEach((sword) => gameMap.placeEntity(sword));
    potions.forEach((potion) => gameMap.placeEntity(potion));
  });
  setTimeout(() => {
    gameMap.render()
  }, 100);
});

