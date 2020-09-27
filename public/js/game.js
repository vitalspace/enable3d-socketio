const { enable3d, Scene3D, Canvas, THREE, ExtendedObject3D } = ENABLE3D

class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.requestThirdDimension()
    this.camerasArr = []
    this.socket = io()
    this.cameraIndex = 0
    this.canCameraMove = true
    delete this.keys
    delete this.player
  }

  create() {
    this.accessThirdDimension()
    this.third.warpSpeed('camera', 'ground', '-grid', '-orbitControls', 'light', 'sky')
    this.third.renderer.gammaFactor = 1.5

    // this.third.warpSpeed('camera', 'light', 'sky')
    this.third.camera.position.set(10, 10, 20)

    // Players Group
    let playersObject = []

    // this.third.physics.debug.enable()

    // Map

    // const map = async () => {
    //   const object = await this.third.load.gltf('/assets/glb/mapOne.glb')
    //   console.log(object)
    //   const scene = object.scenes[0]

    //   const book = new ExtendedObject3D()
    //   book.name = 'scene'
    //   book.add(scene)
    //   this.third.add.existing(book)

    //   book.traverse(child => {

    //     if (child.isMesh) {
    //       child.castShadow = child.receiveShadow = false
    //       child.material.metalness = 0
    //       child.material.roughness = 1

    //       if (child.name) {
    //         this.third.physics.add.existing(child, {
    //           shape: 'concave',
    //           mass: 0,
    //           collisionFlags: 1,
    //           autoCenter: false,
    //         })
    //       }
    //     }
    //   })
    // }

    // map()


    // add player
    const playerOne = (playerInfo) => {
      // <-- Settings for this player
      this.player = new THREE.Group()
      this.player.name = playerInfo.playerId
      this.player.uuid = playerInfo.playerId
      this.player.position.set(playerInfo.x, playerInfo.y, playerInfo.z)
      const body = this.third.add.box({ height: 0.8, y: 1, width: 0.4, depth: 0.4 }, { lambert: { color: 0xffff00 } })
      const head = this.third.add.sphere({ radius: 0.25, y: 1.7, z: 0.05 }, { lambert: { color: 0xffff00 } })
      this.player.add(body, head)
      this.third.add.existing(this.player)
      this.third.physics.add.existing(this.player)
    }

    const playerTwo = (playerInfo) => {
      // <-- Settings for this player
      this.playertwo = new THREE.Group()
      this.playertwo.name = playerInfo.playerId
      this.playertwo.uuid = playerInfo.playerId
      this.playertwo.position.set(playerInfo.x, playerInfo.y, playerInfo.z)
      const body = this.third.add.box({ height: 0.8, y: 1, width: 0.4, depth: 0.4 }, { lambert: { color: 0xFF3333 } })
      const head = this.third.add.sphere({ radius: 0.25, y: 1.7, z: 0.05 }, { lambert: { color: 0xFF3333 } })
      this.playertwo.add(body, head)
      this.third.add.existing(this.playertwo)
      playersObject.push(this.playertwo)
    }

    // add camera
    const camera = () => {
      // default camera
      const followCam = new THREE.Object3D()
      // copies the position of the default camera
      followCam.position.copy(this.third.camera.position)
      this.player.add(followCam)
      this.camerasArr.push(followCam)

      // back camera
      const frontCam = new THREE.Object3D()
      frontCam.position.copy(new THREE.Vector3(0, 3, -5))
      this.player.add(frontCam)
      this.camerasArr.push(frontCam)

      // overhead camera
      const overheadCam = new THREE.Object3D()
      overheadCam.position.copy(new THREE.Vector3(0, 20, 0))
      // this.player.add(overheadCam) // uncomment this line if you want the overheadCam follow the player
      this.camerasArr.push(overheadCam)
    }

    this.socket.on('currentPlayers', (players) => {
      Object.keys(players).forEach((id) => {
        if (players[id].playerId === this.socket.id) {
          playerOne(players[id])
          camera()
          console.log('Hola: ', players[id].playerId, this.player.uuid)
        } else {
          playerTwo(players[id])
        }
      });
    });

    this.socket.on('newPlayer', (playerInfo) => {
      playerTwo(playerInfo);
    });

    this.socket.on('disconnect', (playerId) => {
      playersObject.forEach(players => {
        if (playerId === players.uuid) {
          const actPlayer = playersObject.filter(item => item.uuid !== playerId)
          playersObject = actPlayer
          this.third.physics.destroy(players)
          players.visible = false
        }
      })
    });

    this.socket.on('playerMoved', function (playerInfo) {

      playersObject.forEach(players => {
        if (playerInfo.playerId === players.uuid) {
          players.position.x = playerInfo.x
          players.position.y = playerInfo.y
          players.position.z = playerInfo.z
          players.rotation.x = playerInfo.r.x
          players.rotation.y = playerInfo.r.y
          players.rotation.z = playerInfo.r.z
        }
      })
    });

    // add keys
    this.keys = {
      a: this.input.keyboard.addKey('a'),
      w: this.input.keyboard.addKey('w'),
      d: this.input.keyboard.addKey('d'),
      s: this.input.keyboard.addKey('s'),
      space: this.input.keyboard.addKey(32)
    }

  }


  update(time, delta) {
    if (typeof this.player?.body === 'undefined') return

    this.third.camera.position.lerp(this.camerasArr[this.cameraIndex % 3].getWorldPosition(new THREE.Vector3()), 0.05)
    const pos = this.player.position.clone()
    this.third.camera.lookAt(pos.x, pos.y + 3, pos.z)

    //if (pos.y < -20) this.scene.restart()

    if (this.keys.space.isDown) {
      if (this.canCameraMove) {
        this.canCameraMove = false
        this.time.addEvent({
          delay: 250,
          callback: () => (this.canCameraMove = true)
        })
        this.cameraIndex++
      }
    }
    if (this.keys.w.isDown) {
      const speed = 4
      const rotation = this.player.getWorldDirection(this.player.rotation.toVector3())
      const theta = Math.atan2(rotation.x, rotation.z)

      const x = Math.sin(theta) * speed,
        y = this.player.body.velocity.y,
        z = Math.cos(theta) * speed

      this.player.body.setVelocity(x, y, z)
    }

    if (this.keys.a.isDown) this.player.body.setAngularVelocityY(3)
    else if (this.keys.d.isDown) this.player.body.setAngularVelocityY(-3)
    else this.player.body.setAngularVelocityY(0)


    //emit player movement
    var x = this.player.body.position.x
    var y = this.player.body.position.y
    var z = this.player.body.position.z
    var r = this.player.body.rotation

    if (this.player.oldPosition &&
      (
        x !== this.player.oldPosition.x ||
        y !== this.player.oldPosition.y ||
        z !== this.player.oldPosition.z ||
        r !== this.player.body.rotation
      )) {
      this.socket.emit('playerMovement', {
        x: this.player.body.position.x,
        y: this.player.body.position.y,
        z: this.player.body.position.z,
        r: this.player.body.rotation
      });
    }

    // save old position data
    this.player.oldPosition = {
      x: this.player.body.position.x,
      y: this.player.body.position.y,
      z: this.player.body.position.z,
      r: this.player.body.rotation
    }
  }
}

const config = {
  type: Phaser.WEBGL,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2),
    height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2)
  },
  scene: [MainScene],
  ...Canvas()
}

window.addEventListener('load', () => {
  enable3d(() => new Phaser.Game(config)).withPhysics('/lib')
})
