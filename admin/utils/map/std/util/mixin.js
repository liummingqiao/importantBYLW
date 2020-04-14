
/**
 * 此方法实现多继承, 只有 baseClass是class ，其他 mixins 必须是标准Object对象, 且 Object中只能复制方法
 * mixins从左到右拷贝
 * @function mixin
 * @memberof std/util/
 * @param {class} baseClass ES5的 class
 * @param  {...any} mixins 合并到baseClass的object
 */
function mixin(baseClass, ...mixins) {
  class Mix extends baseClass {}

  for (const mixTo of mixins) {
    copyFunctions(Mix.prototype, mixTo) // 拷贝原型方法
  }

  return Mix
}

function copyFunctions(target, source) {
  for (const key of Reflect.ownKeys(source)) {
    if (key !== 'constructor' &&
      key !== 'prototype'
    ) {
      const desc = Object.getOwnPropertyDescriptor(source, key)
      if (typeof desc.value === 'function') {
        Object.defineProperty(target, key, desc)
      }
    }
  }
}

export default mixin
