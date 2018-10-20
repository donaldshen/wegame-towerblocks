import 'libs/weapp-adapter'
// @ts-ignore
import * as TWEEN from 'libs/Tween.min'
// @ts-ignore
import * as THREE from 'libs/three3.min'

interface BlockReturn {
  placed?: any
  chopped?: any
  plane: 'x' | 'y' | 'z'
  direction: number
  bonus?: boolean
}

class Stage {
  private camera: THREE.OrthographicCamera
  // @ts-ignore
  private scene = new THREE.Scene()
  private renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  })
  private light: any
  private softLight: any

  constructor () {

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor('#D0CBC7', 1)

    // scene

    // camera

    const aspect = window.innerWidth / window.innerHeight
    const d = 20
    this.camera = new THREE.OrthographicCamera(- d * aspect, d * aspect, d, - d, -100, 1000)
    this.camera.position.set(2, 2, 2)
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))

    // light

    this.light = new THREE.DirectionalLight(0xffffff, 0.5)
    this.light.position.set(0, 499, 0)
    this.scene.add(this.light)

    this.softLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(this.softLight)

    this.onResize()
  }

  setCamera (y: number, speed: number = 0.3) {
    // TweenLite.to(this.camera.position, speed, { y: y + 4, ease: Power1.easeInOut })
    // TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut })
  }

  onResize () {
    let viewSize = 30
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.camera.left = window.innerWidth / - viewSize
    this.camera.right = window.innerWidth / viewSize
    this.camera.top = window.innerHeight / viewSize
    this.camera.bottom = window.innerHeight / - viewSize
    this.camera.updateProjectionMatrix()
  }

  render () {
    this.renderer.render(this.scene, this.camera)
  }

  add (elem) {
    this.scene.add(elem)
  }

  remove (elem) {
    this.scene.remove(elem)
  }
}

class Block {
  static readonly STATES = { ACTIVE: 'active', STOPPED: 'stopped', MISSED: 'missed' }
  static readonly MOVE_AMOUNT = 12

  dimension = { width: 0, height: 0, depth: 0 }
  position = new THREE.Vector3(0, 0, 0)

  mesh: any
  state: string
  index: number
  speed: number
  direction: number
  colorOffset: number
  color: number
  material: any

  workingPlane: 'x' | 'z'
  workingDimension: 'width' | 'depth'

  constructor (
    public targetBlock: Block,
  ) {

    this.index = this.targetBlock.index + 1
    this.workingPlane = this.index % 2 ? 'x' : 'z'
    this.workingDimension = this.index % 2 ? 'width' : 'depth'

    // set the dimensions from the target block, or defaults.

    this.dimension.width = this.targetBlock.dimension.width
    this.dimension.height = this.targetBlock.dimension.height
    this.dimension.depth = this.targetBlock.dimension.depth

    this.position.x = this.targetBlock.position.x
    this.position.y = this.dimension.height * this.index
    this.position.z = this.targetBlock.position.z
    this.colorOffset = this.targetBlock.colorOffset

    // set color
    const offset = this.index + this.colorOffset
    const r = Math.sin(0.3 * offset) * 55 + 200
    const g = Math.sin(0.3 * offset + 2) * 55 + 200
    const b = Math.sin(0.3 * offset + 4) * 55 + 200
    this.color = new THREE.Color(r / 255, g / 255, b / 255)

    // state

    this.state = this.index > 1 ? Block.STATES.ACTIVE : Block.STATES.STOPPED

    // set direction

    this.speed = -0.1 - (this.index * 0.005)
    if (this.speed < -4) this.speed = -4
    this.direction = this.speed

    // create block

    const { width, height, depth } = this.dimension
    const geometry = new THREE.BoxGeometry(width, height, depth)
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(width / 2, height / 2, depth / 2))
    this.material = new THREE.MeshToonMaterial({ color: this.color, shading: THREE.FlatShading })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.position.copy(this.position)

    if (this.state === Block.STATES.ACTIVE) {
      this.position[this.workingPlane] = Block.MOVE_AMOUNT * (Math.random() > 0.5 ? -1 : 1)
    }
  }

  reverseDirection () {
    this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed)
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

    if (this.dimension[wd] - overlap < 0.3) {
      overlap = this.dimension[wd]
      blocksToReturn.bonus = true
      this.position.x = targetBlock.position.x
      this.position.z = targetBlock.position.z
      this.dimension.width = targetBlock.dimension.width
      this.dimension.depth = targetBlock.dimension.depth
    }

    if (overlap > 0) {
      const choppedDimensions = Object.assign({}, this.dimension)
      choppedDimensions[wd] -= overlap
      this.dimension[wd] = overlap

      const placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth)
      placedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2))
      const placedMesh = new THREE.Mesh(placedGeometry, this.material)

      let choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth)
      choppedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(choppedDimensions.width / 2, choppedDimensions.height / 2, choppedDimensions.depth / 2))
      let choppedMesh = new THREE.Mesh(choppedGeometry, this.material)

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

    this.dimension[wd] = overlap

    return blocksToReturn
  }

  tick () {
    if (this.state === Block.STATES.ACTIVE) {
      let value = this.position[this.workingPlane]
      if (value > Block.MOVE_AMOUNT || value < -Block.MOVE_AMOUNT) this.reverseDirection()
      this.position[this.workingPlane] += this.direction
      this.mesh.position[this.workingPlane] = this.position[this.workingPlane]
    }
  }
}
