import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)
const moduleA = {
  state: {...},
  mutations: {...},
  actions: {...},
  getters: {...}
}
export const store = new Vuex.Store({
  debug: true,
  strict: true,
  modules: {
    a: moduleA,
    b: moduleB
  },
  state: {
    filters: {},
    count: 0
  },
  getters: {
    doneTodos: state => {
      return state.todos.filter(todo => todo.done)
    }
  },
  actions: {
    increment (context) {
      context.commit('increment')
    }
  },
  mutations: {
    increment (state) {
      state.count++
    }
  }
})
//store.state.a // -> moduleA 的状态
