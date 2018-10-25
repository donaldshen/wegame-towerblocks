console.clear()

function delay (time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

function resetOrigin (geometry: THREE.BoxGeometry) {
  const { width, height, depth } = geometry.parameters
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(width / 2, height / 2, depth / 2))
}

class Stage {
  private container = document.getElementById('game')
  private camera = (() => {
    const aspect = window.innerWidth / window.innerHeight
    const d = 20
    const camera = new THREE.OrthographicCamera(- d * aspect, d * aspect, d, - d, -100, 1000)
    camera.position.set(2, 2, 2)
    camera.lookAt(new THREE.Vector3(0, 0, 0))
    return camera
  })()
  private scene = new THREE.Scene()
  private renderer = (() => {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor('#D0CBC7', 1)
    this.container!.appendChild(renderer.domElement)
    return renderer
  })()

  constructor () {
    const axesHelper = new THREE.AxesHelper(20)
    this.scene.add(axesHelper)
    // light
    const light = new THREE.DirectionalLight(0xffffff, 0.5)
    light.position.set(0, 499, 0)
    this.scene.add(light)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4))

    window.addEventListener('resize', () => this.onResize())
    this.onResize()
  }

  setCamera (y: number, dur = 300) {
    new TWEEN.Tween(this.camera.position)
      .to({ y: y + 4 }, dur)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()
    new TWEEN.Tween(this.camera.lookAt)
      .to({ y }, dur)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()
  }

  onResize () {
    const viewSize = 30
    const { innerWidth, innerHeight } = window
    this.renderer.setSize(innerWidth, innerHeight)
    this.camera.left = innerWidth / - viewSize
    this.camera.right = innerWidth / viewSize
    this.camera.top = innerHeight / viewSize
    this.camera.bottom = innerHeight / - viewSize
    this.camera.updateProjectionMatrix()
  }

  render () {
    this.renderer.render(this.scene, this.camera)
  }

  add (elem: THREE.Object3D) {
    this.scene.add(elem)
  }

  remove (elem: THREE.Object3D) {
    this.scene.remove(elem)
  }
}

class Block {
  static readonly MOVE_AMOUNT = 12
  static readonly height = 2

  mesh: THREE.Mesh
  get dimension () {
    return (this.mesh.geometry as THREE.BoxGeometry).parameters
  }
  get position () {
    return this.mesh.position
  }
  movingAxis: 'x' | 'z' = 'x'
  direction = 0.1
  colorOffset = Math.round(Math.random() * 100)
  material = new THREE.MeshPhongMaterial({ color: 0x333344, flatShading: true })
  private floor = 1
  private active = false

  constructor (
    private readonly stage: Stage,
    private readonly blockBelow?: Block,
  ) {
    const position = new THREE.Vector3()
    let dimension = { width: 10, height: Block.height, depth: 10 }

    if (blockBelow) {
      this.floor = blockBelow.floor + 1
      this.colorOffset = blockBelow.colorOffset + 1
      this.active = true
      this.movingAxis = blockBelow.movingAxis === 'z' ? 'x' : 'z'
      dimension = blockBelow.dimension
      position.copy(blockBelow.position)
      position.y += Block.height
      position[this.movingAxis] = Block.MOVE_AMOUNT * (Math.random() > 0.5 ? -1 : 1)

      const offset = this.colorOffset
      this.material.color = new THREE.Color(
        0.8 + 0.2 * Math.sin(0.3 * offset),
        0.8 + 0.2 * Math.sin(0.3 * offset + 2),
        0.8 + 0.2 * Math.sin(0.3 * offset + 4),
      )

      // set direction
      this.direction = Math.abs(blockBelow.direction) + 0.005
    }

    // create block
    const { width, height, depth } = dimension
    const geometry = new THREE.BoxGeometry(width, height, depth)
    resetOrigin(geometry)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.position.copy(position)
    stage.add(this.mesh)
  }

  place () {
    if (!this.blockBelow) throw new Error('底层block不能被place')

    const {
      position,
      dimension,
      blockBelow: below,
      movingAxis: ma,
    } = this

    const chopping = ma === 'x' ? 'width' : 'depth'

    this.active = false

    const overlap = dimension[chopping] - Math.abs(position[ma] - below.position[ma])

    if (overlap <= 0) {
      this.drop()
      return false
    } else {
      if (dimension[chopping] - overlap < 0.3) {
        position[ma] = below.position[ma]
      } else {
        const dimensionChopped = Object.assign({}, dimension)
        dimension[chopping] = overlap
        dimensionChopped[chopping] -= overlap

        const placedGeometry = new THREE.BoxGeometry(
          dimension.width,
          dimension.height,
          dimension.depth,
        )
        resetOrigin(placedGeometry)
        this.stage.remove(this.mesh)
        this.mesh = new THREE.Mesh(placedGeometry, this.material)
        this.stage.add(this.mesh)

        const choppedGeometry = new THREE.BoxGeometry(
          dimensionChopped.width,
          dimensionChopped.height,
          dimensionChopped.depth,
        )
        resetOrigin(choppedGeometry)
        const chopped = new THREE.Mesh(choppedGeometry, this.material)
        this.stage.add(chopped)

        this.position.copy(position)
        chopped.position.copy(position)
        // NOTE: block的原点在端点处
        if (position[ma] < below.position[ma]) {
          this.position[ma] = below.position[ma]
        } else {
          chopped.position[ma] += overlap
        }

        this.drop(chopped)
      }

      return true
    }
  }

  drop (chopped?: THREE.Mesh) {
    const dur = 1500
    const ma = this.movingAxis
    const positionTo = { x: '+0', z: '+0', y: '-30' }

    if (chopped) {
      const isChoppedBefore = chopped.position[ma] > this.position[ma]

      positionTo[ma] = `${ isChoppedBefore ? '+' : '-' }${ 40 * Math.abs(this.direction) }`

      const decisionTree: { [k: string]: {
        [k2: string]: { axis: 'x' | 'z', factor: -1 | 1 } }
      } = {
        x: {
          true: { axis: 'z', factor: -1 },
          false: { axis: 'z', factor: 1 },
        },
        z: {
          true: { axis: 'x', factor: 1 },
          false: { axis: 'x', factor: -1 },
        },
      }
      const { axis, factor } = decisionTree[ma][`${ isChoppedBefore }`]
      const from = { x: 0, y: 0, z: 0 }
      const to = Object.assign({
        x: 0.1,
        y: Math.random() * 0.1,
        z: 0.1,
      }, { [axis]: 5 * factor })
      // BUG: 没法直接放chopped.rotation
      new TWEEN.Tween(from)
        .to(to, dur)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => Object.assign(chopped!.rotation, from))
        .start()
    } else {
      chopped = this.mesh
      positionTo[ma] = `${ this.direction > 0 ? '+' : '' }${ 100 * this.direction }`
    }

    new TWEEN.Tween(chopped!.position)
      .to(positionTo, dur)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onComplete(() => this.stage.remove(chopped!))
      .start()
  }

  tick () {
    if (!this.active) return

    const ma = this.movingAxis
    const p = this.mesh.position[ma]
    if (Math.abs(p) > Block.MOVE_AMOUNT) this.direction *= -1
    this.mesh.position[ma] += this.direction
  }
}

enum GAME_STATES {
  READY = 'ready',
  PLAYING = 'playing',
  ENDED = 'ended',
  RESETTING = 'resetting',
}

class Game {

	// UI elements

  mainContainer = document.getElementById('container')
  scoreContainer = document.getElementById('score')
  startButton = document.getElementById('start-button')
  instructions = document.getElementById('instructions')

  stage = new Stage()
  blocks: Block[] = [new Block(this.stage)]
  state = GAME_STATES.READY
  get score () {
    return Math.max(0, this.blocks.length - 2)
  }

  constructor () {
    this.stage.setCamera(2)

    this.tick()

    this.updateState(GAME_STATES.READY)

    const onAction = () => {
      switch (this.state) {
        case GAME_STATES.READY:
          this.startGame()
          break
        case GAME_STATES.PLAYING:
          this.placeBlock()
          break
        case GAME_STATES.ENDED:
          this.restartGame()
          break
      }
    }

    document.addEventListener('keydown', e => e.keyCode === 32 && onAction())
    document.addEventListener('click', onAction)
  }

  updateState (newState: GAME_STATES) {
    Object.values(GAME_STATES)
      .forEach(v => this.mainContainer!.classList.remove(v))
    this.mainContainer!.classList.add(newState)
    this.state = newState
  }

  updateScore () {
    this.scoreContainer!.innerHTML = `${ this.score }`
  }

  startGame () {
    switch (this.state) {
      case GAME_STATES.READY:
      case GAME_STATES.RESETTING:
        this.updateState(GAME_STATES.PLAYING)
        this.addBlock()
        this.updateScore()
        break
    }
  }

  addBlock () {
    const { blocks } = this
    blocks.unshift(new Block(this.stage, blocks[0]))
    this.stage.setCamera(blocks.length * 2)
    this.instructions!.classList[blocks.length > 4 ? 'add' : 'remove']('hide')
  }

  placeBlock () {
    if (this.blocks[0].place()) {
      this.addBlock()
      this.updateScore()
    } else {
      this.updateState(GAME_STATES.ENDED)
    }
  }

  async restartGame () {
    this.updateState(GAME_STATES.RESETTING)

    const { blocks } = this
    this.blocks = [blocks.pop()!]

    const dur = 200
    const delayAmount = 20

    const cameraSpeed = dur * 2 + (blocks.length * delayAmount)
    this.stage.setCamera(2, cameraSpeed)
    setTimeout(() => this.startGame(), cameraSpeed)

    while (blocks.length) {
      const { mesh } = blocks.shift()!
      this.updateScore()
      new TWEEN.Tween(mesh.scale)
        .to({ x: 0, y: 0, z: 0 }, dur)
        .easing(TWEEN.Easing.Quadratic.In)
        .start()
      new TWEEN.Tween(mesh.rotation)
        .to({ y: 0.5 }, dur)
        .easing(TWEEN.Easing.Quadratic.In)
        .onComplete(() => this.stage.remove(mesh))
        .start()
      await delay(delayAmount)
    }
  }

  tick () {
    TWEEN.update()
    this.blocks.forEach(b => b.tick())
    this.stage.render()
    requestAnimationFrame(() => this.tick())
  }
}

new Game()
