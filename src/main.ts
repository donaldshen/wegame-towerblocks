// @ts-ignore
import * as THREE from 'libs/three.min'
// @ts-ignore
import * as TWEEN from './libs/Tween.min'

interface BlockReturn {
  placed?: any
  chopped?: any
  plane: 'x' | 'y' | 'z'
  direction: number
  bonus?: boolean
}

class Stage {
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
      canvas,
      antialias: true,
      alpha: false,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor('#D0CBC7', 1)
    return renderer
  })()

  constructor () {

    // light
    const light = new THREE.DirectionalLight(0xffffff, 0.5)
    light.position.set(0, 499, 0)
    this.scene.add(light)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4))
  }

  setCamera (y: number, dur: number = 0.3) {
    new TWEEN.Tween(this.camera.position)
      .to({ y: y + 4 }, dur * 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()
    new TWEEN.Tween(this.camera.lookAt)
      .to({ y }, dur * 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()
  }

  render () {
    TWEEN.update()
    this.renderer.render(this.scene, this.camera)
  }

  add (elem: THREE.Group) {
    this.scene.add(elem)
  }
}

class Block {
  static readonly STATES = { ACTIVE: 'active', STOPPED: 'stopped', MISSED: 'missed' }
  static readonly MOVE_AMOUNT = 12

  dimension = new THREE.Vector3(0, 0, 0)
  position = new THREE.Vector3(0, 0, 0)

  mesh: any
  state: string
  index: number
  direction: number
  colorOffset: number
  color: THREE.Color
  material: THREE.MeshPhongMaterial

  workingPlane: 'x' | 'z'
  workingDimension: 'x' | 'z'

  constructor (
    public targetBlock: Block,
  ) {

    this.index = this.targetBlock.index + 1
    this.state = Block.STATES[this.index > 1 ? 'ACTIVE' : 'STOPPED']

    this.workingPlane = this.index % 2 ? 'x' : 'z'
    this.workingDimension = this.index % 2 ? 'x' : 'z'

    // set the dimensions from the target block, or defaults.
    this.dimension = Object.assign({}, this.targetBlock.dimension)
    this.position = Object.assign({}, this.targetBlock.position, {
      y: this.dimension.y * this.index,
    })
    if (this.state === Block.STATES.ACTIVE) {
      this.position[this.workingPlane] = Block.MOVE_AMOUNT * (Math.random() > 0.5 ? -1 : 1)
    }

    // set color
    this.colorOffset = this.targetBlock.colorOffset
    const offset = this.index + this.colorOffset
    this.color = new THREE.Color(
      0.8 + 0.2 * Math.sin(0.3 * offset),
      0.8 + 0.2 * Math.sin(0.3 * offset + 2),
      0.8 + 0.2 * Math.sin(0.3 * offset + 4),
    )

    // set direction
    this.direction = Math.max(-4, -0.1 - this.index * 0.005)

    // create block

    const { x, y, z } = this.dimension
    const geometry = new THREE.BoxGeometry(x, y, z)
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(x / 2, y / 2, z / 2))
    this.material = new THREE.MeshPhongMaterial({ color: this.color })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.position.copy(this.position)
  }

  place () {
    this.state = Block.STATES.STOPPED
    const {
      targetBlock,
      workingDimension: wd,
      workingPlane: wp,
    } = this

    let overlap = targetBlock.dimension[wd] - Math.abs(this.position[wp] - targetBlock.position[wp])

    const blocksToReturn: BlockReturn = {
      plane: wp,
      direction: this.direction,
    }

    if (overlap > 0) {
      if (this.dimension[wd] - overlap < 0.3) {
        overlap = this.dimension[wd]
        blocksToReturn.bonus = true
        this.position.x = targetBlock.position.x
        this.position.z = targetBlock.position.z
        this.dimension.x = targetBlock.dimension.x
        this.dimension.z = targetBlock.dimension.z
      }

      this.dimension[wd] = overlap

      let { x, y, z } = this.dimension
      const placedGeometry = new THREE.BoxGeometry(x, y, z)
      placedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(x / 2, y / 2, z / 2))
      const placedMesh = new THREE.Mesh(placedGeometry, this.material)

      if (wd === 'x') x -= overlap
      else z -= overlap
      const choppedGeometry = new THREE.BoxGeometry(x, y, z)
      choppedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(x / 2, y / 2, z / 2))
      const choppedMesh = new THREE.Mesh(choppedGeometry, this.material)

      const choppedPosition = this.position.clone()

      if (this.position[wp] < targetBlock.position[wp]) {
        this.position[wp] = targetBlock.position[wp]
      } else {
        choppedPosition[wp] += overlap
      }

      placedMesh.position.copy(this.position)
      choppedMesh.position.copy(choppedPosition)

      blocksToReturn.placed = placedMesh
      if (!blocksToReturn.bonus) blocksToReturn.chopped = choppedMesh
    } else {
      this.state = Block.STATES.MISSED
    }

    return blocksToReturn
  }

  tick () {
    if (this.state !== Block.STATES.ACTIVE) return

    const wp = this.workingPlane
    const p = this.position[wp]
    if (Math.abs(p) > Block.MOVE_AMOUNT) this.direction *= -1
    this.position[wp] += this.direction
    this.mesh.position[wp] = this.position[wp]
  }
}

class Game {
  static readonly STATES = {
    'LOADING': 'loading',
    'PLAYING': 'playing',
    'READY': 'ready',
    'ENDED': 'ended',
    'RESETTING': 'resetting',
  }
  blocks: Block[] = []
  state: string = Game.STATES.LOADING

  // groups

  newBlocks = new THREE.Group()
  placedBlocks = new THREE.Group()
  choppedBlocks = new THREE.Group()

  // UI elements

  score = 0
  mainContainer = document.getElementById('container')
  startButton = document.getElementById('start-button')
  instructions = document.getElementById('instructions')

  stage = new Stage()

  constructor () {

    this.stage.add(this.newBlocks)
    this.stage.add(this.placedBlocks)
    this.stage.add(this.choppedBlocks)

    this.addBlock()
    this.tick()

    this.updateState(Game.STATES.READY)

    document.addEventListener('click', e => {
      this.onAction()
    })

    document.addEventListener('touchstart', e => {
      e.preventDefault()
      // this.onAction();

      // ☝️ this triggers after click on android so you
      // insta-lose, will figure it out later.
    })
  }

  updateState (newState: string) {
    this.state = newState
  }

  onAction () {
    switch (this.state) {
      case Game.STATES.READY:
        this.startGame()
        break
      case Game.STATES.PLAYING:
        this.placeBlock()
        break
      case Game.STATES.ENDED:
        this.restartGame()
        break
    }
  }

  startGame () {
    if (this.state !== Game.STATES.PLAYING) {
      this.score = 0
      this.updateState(Game.STATES.PLAYING)
      this.addBlock()
    }
  }

  restartGame () {
    this.updateState(Game.STATES.RESETTING)

    let oldBlocks = this.placedBlocks.children
    let removeSpeed = 0.2
    let delayAmount = 0.02
    for (let i = 0; i < oldBlocks.length; i++) {
      // TweenLite.to(oldBlocks[i].scale, removeSpeed, { x: 0, y: 0, z: 0, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn, onComplete: () => this.placedBlocks.remove(oldBlocks[i]) })
      // TweenLite.to(oldBlocks[i].rotation, removeSpeed, { y: 0.5, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn })
    }
    let cameraMoveSpeed = removeSpeed * 2 + (oldBlocks.length * delayAmount)
    this.stage.setCamera(2, cameraMoveSpeed)

    let countdown = { value: this.blocks.length - 1 }
    // TweenLite.to(countdown, cameraMoveSpeed, { value: 0, onUpdate: () => { this.scoreContainer.innerHTML = String(Math.round(countdown.value)) } })

    this.blocks = this.blocks.slice(0, 1)

    setTimeout(() => {
      this.startGame()
    }, cameraMoveSpeed * 1000)

  }

  placeBlock () {
    let currentBlock = this.blocks[this.blocks.length - 1]
    let newBlocks: BlockReturn = currentBlock.place()
    this.newBlocks.remove(currentBlock.mesh)
    if (newBlocks.placed) this.placedBlocks.add(newBlocks.placed)
    if (newBlocks.chopped) {
      this.choppedBlocks.add(newBlocks.chopped)
      // let positionParams = { y: '-=30', ease: Power1.easeIn, onComplete: () => this.choppedBlocks.remove(newBlocks.chopped) }
      let rotateRandomness = 10
      let rotationParams = {
        delay: 0.05,
        x: newBlocks.plane === 'z' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
        z: newBlocks.plane === 'x' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
        y: Math.random() * 0.1,
      }
      if (newBlocks.chopped.position[newBlocks.plane] > newBlocks.placed.position[newBlocks.plane]) {
        positionParams[newBlocks.plane] = '+=' + (40 * Math.abs(newBlocks.direction))
      } else {
        positionParams[newBlocks.plane] = '-=' + (40 * Math.abs(newBlocks.direction))
      }
      TweenLite.to(newBlocks.chopped.position, 1, positionParams)
      TweenLite.to(newBlocks.chopped.rotation, 1, rotationParams)

    }

    this.addBlock()
  }

  addBlock () {
    const lastBlock = this.blocks[this.blocks.length - 1]

    if (lastBlock && lastBlock.state === lastBlock.STATES.MISSED) {
      return this.endGame()
    }

    this.score = this.blocks.length - 1

    const newKidOnTheBlock = new Block(lastBlock)
    this.newBlocks.add(newKidOnTheBlock.mesh)
    this.blocks.push(newKidOnTheBlock)

    this.stage.setCamera(this.blocks.length * 2)

    if (this.blocks.length >= 5) this.instructions.classList.add('hide')
  }

  endGame () {
    this.updateState(Game.STATES.ENDED)
  }

  tick () {
    this.blocks[this.blocks.length - 1].tick()
    this.stage.render()
    requestAnimationFrame(() => this.tick())
  }
}

let game = new Game()
