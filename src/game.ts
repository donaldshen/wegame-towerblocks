import 'libs/weapp-adapter'
// @ts-ignore
import * as THREE from 'libs/three.min'

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let cube: THREE.Mesh
const { innerWidth: screenWidth, innerHeight: screenHeight } = window

;(() => {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(
    45,
    screenWidth / screenHeight,
    0.1,
    1000,
  )

  renderer = new THREE.WebGLRenderer({ canvas })
  renderer.setSize(
    screenWidth,
    screenHeight,
    // false, // NOTE: 阻止canvas resize，renderer实际渲染内容会缩放至canvas初始值。可以给renderer设小于canvas size的值，来降低分辨率
  )

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  camera.position.z = 5
  // camera.lookAt(2, 2, -2)

  const geometry2 = new THREE.Geometry()
  geometry2.vertices.push(new THREE.Vector3(-2, 0, 0))
  geometry2.vertices.push(new THREE.Vector3(0, 2, 0))
  geometry2.vertices.push(new THREE.Vector3(2, 0, 0))
  // create a blue LineBasicMaterial
  const material2 = new THREE.LineBasicMaterial({ color: 0x0000ff })
  const line = new THREE.Line(geometry2, material2)
  scene.add(line)

  animate()
})()

function animate () {
  requestAnimationFrame(animate)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  renderer.render(scene, camera)
}
