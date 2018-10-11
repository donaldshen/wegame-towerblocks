declare const canvas: HTMLCanvasElement

declare namespace wx {
  function showToast (config: {
    icon?: string
    title: string
  }): void

  function hideLoading (): void

  function showLoading (config?: {
    title?: string
    mask?: boolean
  })

  function getStorageSync (key: string): any

  function setStorage (config: {
    key: string
    data: any
  }): void

  function onShow (cb: () => void): void
  function onHide (cb: () => void): void

  function getLaunchOptionsSync (): any

  function setEnableDebug (config: { enableDebug: boolean }): void

  function showShareMenu (): void

  function shareAppMessage (config: {
    title: string
    imageUrl: string
    query?: string
    success?: (any) => void
    fail?: (any) => void
  }): void

  function onShareAppMessage (cb: () => void): void

  function getOpenDataContext (): OpenDataContext

  function onMessage (cb: (msg: {
    method: string
    [prop: string]: any
  }) => void): void

  function setUserCloudStorage (config: {
    KVDataList: {
      key: string
      value: string
    }[]
  }): void

  function getSharedCanvas (): HTMLCanvasElement

  function createImage (): HTMLImageElement

  function createUserInfoButton (config: {
    type: 'text' | 'image'
    text?: string
    image?: string
    style: UserInfoButtonStyle
    withCredentials: boolean
    lang: 'en' | 'zh_CN' | 'zh_TW'
  }): UserInfoButton

  function getSystemInfoSync (): {
    windowWidth: number
    windowHeight: number
  }

  function onNetworkStatusChange (cb: (res: {
    isConnected: boolean
    networkType: 'wifi' | '2g' | '3g' | '4g' | 'unknown' | 'none'
  }) => void): void
}

declare interface OpenDataContext {
  canvas: HTMLCanvasElement
  postMessage (msg: {
    method: string
    [prop: string]: any
  }): void
}

interface UserInfoButtonStyle {
  left: number
  top: number
  width: number
  height: number
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  textAlign?: 'left' | 'center' | 'right'
  fontSize?: number
  lineHeight?: number
}

declare interface UserInfoButton {
  type: 'text' | 'image'
  text?: string
  image?: string

  onTap (cb: (res: {
    rawData?: string
  }) => void): void

  destroy (): void
}
