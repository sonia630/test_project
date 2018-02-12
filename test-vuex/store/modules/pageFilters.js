import * as types from '../mutaion-types'
// initial state
/**
 * @type {{conditions: {date: {daily: true, weekly: false, monthly: true},
    cloud: true,
    datacenter: true,
    server: true,
    cluster: false,
    site: true,
    bridge: true}, checkoutStatus: null}}
 */
const state = {
  conditions: {},
  qryConditions: {
    dateType: 'daily',
    daily: [new Date(), new Date()],
    weekly: ['', ''],
    monthly: ['', ''],
    cloud: 'production',
    datacenter: '',
    server: '',
    cluster: '',
    site: '',
    bridge: ''
  },
  checkoutStatus: null
}
// getters
const getters = {
  filterConditions: state => state.conditions,
  filterQryConditions: state => state.qryConditions
}
// actions
const actions = {
  initPageFilters ({commit}, myConditions) {
    console.log(' 111 myConditions', myConditions)
    commit(types.INIT_PAGE_FILTER, {myConditions})
  },
  updateQryConditions ({commit}, myQryConditoins) {
    commit(types.UPDATE_QRY_CONDITIONS, {myQryConditoins})
  }
}
// mutations
const mutations = {
  [types.INIT_PAGE_FILTER] (state, {myConditions}) {
    if (myConditions) {
      state.conditions = myConditions
      console.log('----my conditions---', state.conditions)
    }
  },
  [types.UPDATE_QRY_CONDITIONS] (state, {myQryConditoins}) {
    console.log('1 myQryConditoins', myQryConditoins)
    if (myQryConditoins) {
      const qryConditions = state.qryConditions
      qryConditions.dateType = myQryConditoins.dateType
      qryConditions.daily = myQryConditoins.daily
      qryConditions.weekly = myQryConditoins.weekly
      qryConditions.cloud = myQryConditoins.cloud
      qryConditions.datacenter = myQryConditoins.datacenter
      qryConditions.server = myQryConditoins.server
      qryConditions.cluster = myQryConditoins.cluster
      qryConditions.site = myQryConditoins.site
      qryConditions.bridge = myQryConditoins.bridge
      console.log('----2 my qry conditoins---', state.qryConditions)
    }
  }
}
export default {
  state,
  getters,
  actions,
  mutations
}
