import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as getters from './getters'
import pageFilters from './modules/pageFilters'
// import createLogger from '../../../src/plugins/logger'
Vue.use(Vuex)
const debug = process.env.NODE_ENV !== 'production'
export default new Vuex.Store({
  actions,
  getters,
  strict: debug,
  // plugins: debug ? [createLogger()] : []
  modules: {
    pageFilters
  }
})
