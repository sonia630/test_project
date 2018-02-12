<template>
  <el-form :inline="false" ref="qryConditions" :model="qryConditions" label-width="120px" label-suffix=":">

    <el-tabs v-if="filters.daily||filters.weekly||filters.monthly" v-model="qryConditions.dateType">
      <el-tab-pane label="Daily" v-if="filters.daily" name="daily">
        <el-form-item label="Daily">
          <el-date-picker
            v-model="qryConditions.daily"
            type="daterange"
            align="left"
            unlink-panels
            range-separator="-"
            start-placeholder="Start Date"
            end-placeholder="End Date"
            :picker-options="pickerOptions"
            value-qryConditionsat="yyyy-MM-dd"
          >
          </el-date-picker>
        </el-form-item>
      </el-tab-pane>

      <el-tab-pane label="Weekly" v-if="filters.weekly" name="weekly">
        <el-form-item label="Weekly">

          <el-date-picker v-model="qryConditions.weekly[0]" @change="changeWeekly( $event)"
                          placeholder="Start Week"
                          type="week" qryConditionsat="yyyywWW"></el-date-picker>
          -
          <el-date-picker v-model="qryConditions.weekly[1]" placeholder="End Week" type="week"
                          value-qryConditionsat="yyyy-MM-dd"></el-date-picker>
        </el-form-item>

      </el-tab-pane>

      <el-tab-pane label="Monthly" v-if="filters.monthly" name="monthly">

        <el-form-item label="Monthly">
          <el-date-picker v-model="qryConditions.monthly[0]" placeholder="Start Month" type="month"
                          value-qryConditionsat="yyyy-MM"></el-date-picker>
          -
          <el-date-picker v-model="qryConditions.monthly[1]" placeholder="End Month" type="month"
                          value-qryConditionsat="yyyy-MM"></el-date-picker>
        </el-form-item>

      </el-tab-pane>
    </el-tabs>

    <!--
    <el-form-item label="Date Type" prop="resource">
      <el-radio-group v-model="qryConditions.dateType">
        <el-radio label="Daily" value="daily"></el-radio>
        <el-radio label="Weekly" value="weekly"></el-radio>
        <el-radio label="Monthly" value="monthly"></el-radio>
      </el-radio-group>
    </el-form-item>
    -->


    <el-form-item label="Cloud" v-if="filters.cloud">
      <el-select v-model="qryConditions.cloud" placeholder="  --  ">
        <el-option label="ATS" value="ATS"></el-option>
        <el-option label="BTS" value="BTS"></el-option>
        <el-option label="Production" value="production" :selected="true"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="Bridge" v-if="filters.bridge">
      <el-select v-model="qryConditions.bridge" placeholder="  --  ">
        <el-option
          v-for="item in bridge"
          :key="item.BRIDGE"
          :label="item.BRIDGE"
          :value="item.BRIDGE"
        ></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="Site" v-if="filters.site">
      <el-select v-model="qryConditions.site"
                 placeholder="  please enter keyword  "
                 filterable
                 remote
                 reserve-keyword
                 :remote-method="remoteSiteMethod"
                 :loading="loading">
        <el-option
          v-for="item in site"
          :key="item.id"
          :label="item.title"
          :value="item.id"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="Data Center" v-if="filters.datacenter">
      <el-select v-model="qryConditions.datacenter" placeholder="  --  ">
        <el-option label="dc" value="dc"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="Cluster" v-if="filters.cluster">
      <el-select v-model="qryConditions.cluster" placeholder="  --  ">
        <el-option
          v-for="item in cluster"
          :key="item.CLUSTER"
          :label="item.CLUSTER"
          :value="item.CLUSTER"
        ></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="Server" v-if="filters.server">
      <el-select v-model="qryConditions.server" placeholder="  --  ">
        <el-option label="server" value="server"></el-option>
      </el-select>
    </el-form-item>

    <el-button type="primary" icon="el-icon-search" @click="submitQryConditions('qryConditions')">Search</el-button>

  </el-form>

</template>

<style lang="scss" type="text/scss">
  .floatbar {

    .el-select {
      width: 90%;
    }

    .el-range-editor--small.el-input__inner {
      width: 90%;
    }

    .el-date-editor.el-input {
      width: 43%;
    }
    .el-button {
      position: absolute;
      right: 10px;
      top: 20px;
      cursor: pointer;
      z-index: 2;
    }
  }

</style>
<script>
  import { config } from 'utils/utils'
  import { mapGetters } from 'vuex'

  export default {
    name: 'PageFilter',
    props: [],
    computed: {
      ...mapGetters({
        pageFilters: 'pageFilters'
      }),
      filters () {
//     this.$store.state.pageFilter.pageFilters.conditions;  this.$store.getters.filterConditions  ; this.pageFilters.conditions
        return this.pageFilters.conditions
      },
      globQryConditons () {
        return this.pageFilters.qryConditions
      }
    },
    data: () => ({
      /*
      filters: {
        date: {daily: true, weekly: false, monthly: true},
        cloud: true,
        datacenter: false,
        server: false,
        cluster: false,
        site: true,
        bridge: true
      }, */
      qryConditions: {
        dateType: 'daily',
        daily: ['2007-01-17', '2007-03-20'], weekly: ['', ''], monthly: ['2017-02', '2017-08'],
        cloud: 'production',
        datacenter: '',
        server: '',
        cluster: '',
        site: '',
        bridge: ''
      },
      pickerOptions: {
        shortcuts: [{
          text: 'Past 1 Day',
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 1)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Past 7 Day',
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Past 30 Day',
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Past 60 Day',
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 60)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Past 90 Day',
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }]
      },
      bridge: [],
      cluster: [],
      loading: false,
      eventName: ''
    }),
    watch: {
      qryConditions: {
        handler: function (val, oldVal) {
          console.log('5 watch qry value', val)
          this.$store.dispatch('updateQryConditions', val)
        },
        deep: true
//        immediate: true
      }
    },
    created () {
      this.$root.$emit('qryCondition')
      /*
      this.$root.$on('qryCondition', this.getChartData())
      if (this.filters.daily) {
        this.qryConditions.dateType = 'daily'
      } else if (this.filters.weekly) {
        this.qryConditions.dateType = 'weekly'
      } else if (this.filters.monthly) {
        this.qryConditions.dateType = 'monthly'
      }
      if (this.filters.bridge) {
        this.getBridge()
      }
      if (this.filters.cluster) {
        this.getCluster()
      }
      if (this.filters.site) {
        this.getSite()
      } */
    },
    mounted () {
      console.log('4 this.globQryConditons', this.globQryConditons)
      Object.entries(this.globQryConditons).map(([key, value]) => {
        this.qryConditions[key] = value
      })
      console.log('4.1 this.qryConditions', this.qryConditions)
//      this.qryConditions = this.globQryConditons
    },
    methods: {
      submitQryConditions () {
        console.log('search....')
        console.log('qryConditions', this.qryConditions)
      },
      getDataCenter () {},
      getServer () {},
      getCluster () {
        let response = [{'CLUSTER': 'eab'}, {'CLUSTER': 'eac'}, {'CLUSTER': 'eaf'}, {'CLUSTER': 'eai'}, {'CLUSTER': 'eao'}, {'CLUSTER': 'eas'}, {'CLUSTER': 'eat'}, {'CLUSTER': 'eats1'}, {'CLUSTER': 'eav'}, {'CLUSTER': 'eaw'}, {'CLUSTER': 'eb'}, {'CLUSTER': 'ebi'}, {'CLUSTER': 'ebt2'}, {'CLUSTER': 'ebt21jp'}, {'CLUSTER': 'ebt21ln'}, {'CLUSTER': 'ebt21sg'}, {'CLUSTER': 'ebt3'}, {'CLUSTER': 'ebu'}, {'CLUSTER': 'ebv'}, {'CLUSTER': 'ec'}, {'CLUSTER': 'ecv'}, {'CLUSTER': 'ed1ch'}, {'CLUSTER': 'ed1hk'}, {'CLUSTER': 'ed1jp'}, {'CLUSTER': 'ed1ln'}, {'CLUSTER': 'ed1sg'}, {'CLUSTER': 'ed1sj'}, {'CLUSTER': 'ed1sy'}, {'CLUSTER': 'ed1tx'}, {'CLUSTER': 'ed1va'}, {'CLUSTER': 'ee'}, {'CLUSTER': 'eet'}, {'CLUSTER': 'eev'}, {'CLUSTER': 'ef'}, {'CLUSTER': 'eft'}, {'CLUSTER': 'egt'}, {'CLUSTER': 'eht'}, {'CLUSTER': 'ei'}, {'CLUSTER': 'eia'}, {'CLUSTER': 'eib'}, {'CLUSTER': 'eie'}, {'CLUSTER': 'eij'}, {'CLUSTER': 'eim'}, {'CLUSTER': 'ej'}, {'CLUSTER': 'el'}, {'CLUSTER': 'elt'}, {'CLUSTER': 'em'}, {'CLUSTER': 'emu'}, {'CLUSTER': 'emv'}, {'CLUSTER': 'er'}, {'CLUSTER': 'erv'}, {'CLUSTER': 'es'}, {'CLUSTER': 'esy'}, {'CLUSTER': 'eu'}, {'CLUSTER': 'evv'}, {'CLUSTER': 'ew'}]
        let that = this
        let url = config.avwatch_request_prefix + '/rest/tahoe/summary/'
        let params = {}
//        this.axios.get(url, {params: params}).then(response => {
        that.cluster = response
        /*
         }).catch(e => {
         console.error('Load data error', e.message)
         })*/
      },
      getBridge () {
        let response = [
          {'REGULAR_TELEPHONY': 866, 'SITES': 990, 'CCA_SP': 2, 'CCA_EP': 0, 'BRIDGE': 'tblr3'}, {
            'REGULAR_TELEPHONY': 15090,
            'SITES': 18140,
            'CCA_SP': 0,
            'CCA_EP': 1,
            'BRIDGE': 'tln20'
          }, {'REGULAR_TELEPHONY': 28, 'SITES': 100, 'CCA_SP': 32, 'CCA_EP': 3, 'BRIDGE': 'tln25'}, {
            'REGULAR_TELEPHONY': 7,
            'SITES': 10,
            'CCA_SP': 3,
            'CCA_EP': 0,
            'BRIDGE': 'tln30'
          }, {'REGULAR_TELEPHONY': 0, 'SITES': 2, 'CCA_SP': 0, 'CCA_EP': 0, 'BRIDGE': 'tln31'}, {
            'REGULAR_TELEPHONY': 0,
            'SITES': 2,
            'CCA_SP': 0,
            'CCA_EP': 0,
            'BRIDGE': 'tln32'
          }, {'REGULAR_TELEPHONY': 5225, 'SITES': 7789, 'CCA_SP': 21, 'CCA_EP': 1, 'BRIDGE': 'tsg21'}, {
            'REGULAR_TELEPHONY': 2,
            'SITES': 9,
            'CCA_SP': 0,
            'CCA_EP': 0,
            'BRIDGE': 'tsg27'
          }, {'REGULAR_TELEPHONY': 11462, 'SITES': 13168, 'CCA_SP': 6, 'CCA_EP': 11, 'BRIDGE': 'tsj11'}, {
            'REGULAR_TELEPHONY': 4878,
            'SITES': 4899,
            'CCA_SP': 0,
            'CCA_EP': 6,
            'BRIDGE': 'tsj12'
          }, {'REGULAR_TELEPHONY': 8045, 'SITES': 8078, 'CCA_SP': 2, 'CCA_EP': 23, 'BRIDGE': 'tsj15'}, {
            'REGULAR_TELEPHONY': 13552,
            'SITES': 13611,
            'CCA_SP': 0,
            'CCA_EP': 8,
            'BRIDGE': 'tsj16'
          }, {'REGULAR_TELEPHONY': 11, 'SITES': 127, 'CCA_SP': 108, 'CCA_EP': 0, 'BRIDGE': 'tsj17'}, {
            'REGULAR_TELEPHONY': 7,
            'SITES': 24,
            'CCA_SP': 0,
            'CCA_EP': 16,
            'BRIDGE': 'tsj18'
          }, {'REGULAR_TELEPHONY': 3, 'SITES': 19, 'CCA_SP': 0, 'CCA_EP': 16, 'BRIDGE': 'tsj19'}, {
            'REGULAR_TELEPHONY': 2981,
            'SITES': 3001,
            'CCA_SP': 1,
            'CCA_EP': 13,
            'BRIDGE': 'tsj22'
          }, {'REGULAR_TELEPHONY': 6, 'SITES': 18, 'CCA_SP': 0, 'CCA_EP': 11, 'BRIDGE': 'tsj23'}, {
            'REGULAR_TELEPHONY': 430,
            'SITES': 447,
            'CCA_SP': 0,
            'CCA_EP': 17,
            'BRIDGE': 'tsj24'
          }, {'REGULAR_TELEPHONY': 15, 'SITES': 15, 'CCA_SP': 0, 'CCA_EP': 0, 'BRIDGE': 'tsj26'}, {
            'REGULAR_TELEPHONY': 1,
            'SITES': 12,
            'CCA_SP': 0,
            'CCA_EP': 9,
            'BRIDGE': 'tsj28'
          }, {'REGULAR_TELEPHONY': 32, 'SITES': 133, 'CCA_SP': 69, 'CCA_EP': 0, 'BRIDGE': 'tsj29'}, {
            'REGULAR_TELEPHONY': 4,
            'SITES': 39,
            'CCA_SP': 34,
            'CCA_EP': 0,
            'BRIDGE': 'tsj33'
          }, {'REGULAR_TELEPHONY': 25, 'SITES': 91, 'CCA_SP': 38, 'CCA_EP': 0, 'BRIDGE': 'tsj34'}, {
            'REGULAR_TELEPHONY': 9,
            'SITES': 49,
            'CCA_SP': 27,
            'CCA_EP': 0,
            'BRIDGE': 'tsj36'
          }, {'REGULAR_TELEPHONY': 3976, 'SITES': 7562, 'CCA_SP': 0, 'CCA_EP': 2, 'BRIDGE': 'tsj38'}, {
            'REGULAR_TELEPHONY': 2502,
            'SITES': 2518,
            'CCA_SP': 3,
            'CCA_EP': 2,
            'BRIDGE': 'tsj39'
          }, {'REGULAR_TELEPHONY': 1, 'SITES': 12, 'CCA_SP': 8, 'CCA_EP': 0, 'BRIDGE': 'tsj40'}, {
            'REGULAR_TELEPHONY': 10,
            'SITES': 56,
            'CCA_SP': 26,
            'CCA_EP': 5,
            'BRIDGE': 'tsj42'
          }, {'REGULAR_TELEPHONY': 8, 'SITES': 24, 'CCA_SP': 2, 'CCA_EP': 0, 'BRIDGE': 'tsj43'}, {
            'REGULAR_TELEPHONY': 6,
            'SITES': 13,
            'CCA_SP': 2,
            'CCA_EP': 0,
            'BRIDGE': 'tsj44'
          }, {'REGULAR_TELEPHONY': 6, 'SITES': 6, 'CCA_SP': 0, 'CCA_EP': 0, 'BRIDGE': 'tsj45'}, {
            'REGULAR_TELEPHONY': 0,
            'SITES': 2,
            'CCA_SP': 2,
            'CCA_EP': 0,
            'BRIDGE': 'tsj46'
          }, {'REGULAR_TELEPHONY': 1, 'SITES': 3, 'CCA_SP': 1, 'CCA_EP': 0, 'BRIDGE': 'tsj47'}, {
            'REGULAR_TELEPHONY': 0,
            'SITES': 100597,
            'CCA_SP': 0,
            'CCA_EP': 0,
            'BRIDGE': 'tsj49'
          }, {'REGULAR_TELEPHONY': 22, 'SITES': 98, 'CCA_SP': 45, 'CCA_EP': 0, 'BRIDGE': 'tsj51'}, {
            'REGULAR_TELEPHONY': 2,
            'SITES': 15,
            'CCA_SP': 0,
            'CCA_EP': 0,
            'BRIDGE': 'tsj52'
          }, {'REGULAR_TELEPHONY': 8, 'SITES': 2221, 'CCA_SP': 0, 'CCA_EP': 0, 'BRIDGE': 'tsj53'}, {
            'REGULAR_TELEPHONY': 0,
            'SITES': 2,
            'CCA_SP': 0,
            'CCA_EP': 0,
            'BRIDGE': 'tsj54'
          }, {'REGULAR_TELEPHONY': 0, 'SITES': 1, 'CCA_SP': 0, 'CCA_EP': 0, 'BRIDGE': 'tsj61'}, {
            'REGULAR_TELEPHONY': 0,
            'SITES': 2,
            'CCA_SP': 0,
            'CCA_EP': 0,
            'BRIDGE': 'tsj64'
          }, {'REGULAR_TELEPHONY': 3, 'SITES': 4, 'CCA_SP': 0, 'CCA_EP': 0, 'BRIDGE': 'tsj70'}, {
            'REGULAR_TELEPHONY': 0,
            'SITES': 9,
            'CCA_SP': 0,
            'CCA_EP': 0,
            'BRIDGE': 'tsj71'
          }, {
            'REGULAR_TELEPHONY': 2904,
            'SITES': 2926,
            'CCA_SP': 0,
            'CCA_EP': 11,
            'BRIDGE': 'tsj8'
          }, {'REGULAR_TELEPHONY': 25, 'SITES': 27, 'CCA_SP': 0, 'CCA_EP': 0, 'BRIDGE': 'tsj9'}]
        let that = this
        let url = config.avwatch_request_prefix + '/rest/tahoe/summary/'
        let params = {}
//        this.axios.get(url, {params: params}).then(response => {
        that.bridge = response
        /*
         }).catch(e => {
         console.error('Load data error', e.message)
         })*/
      },
      getSite () {
        let response = {
          'id': 'root',
          'title': 'site list',
          'totalItems': 20,
          'identifier': 'id',
          'items': [{'title': 'cisco(P,303790)', 'sitename': 'cisco', 'rn': 1, 'win': 'P', 'id': 303790}, {
            'title': 'cisco-108.my(P,1859297)',
            'sitename': 'cisco-108.my',
            'rn': 2,
            'win': 'P',
            'id': 1859297
          }, {'title': 'cisco-175.my(P,1877397)', 'sitename': 'cisco-175.my', 'rn': 3, 'win': 'P', 'id': 1877397}, {
            'title': 'cisco-20110714(B,222718)',
            'sitename': 'cisco-20110714',
            'rn': 4,
            'win': 'B',
            'id': 222718
          }, {'title': 'cisco-216.my(P,1865677)', 'sitename': 'cisco-216.my', 'rn': 5, 'win': 'P', 'id': 1865677}, {
            'title': 'cisco-238.my(P,1871157)',
            'sitename': 'cisco-238.my',
            'rn': 6,
            'win': 'P',
            'id': 1871157
          }, {'title': 'cisco-493.my(P,1869802)', 'sitename': 'cisco-493.my', 'rn': 7, 'win': 'P', 'id': 1869802}, {
            'title': 'cisco-507.my(P,1842742)',
            'sitename': 'cisco-507.my',
            'rn': 8,
            'win': 'P',
            'id': 1842742
          }, {'title': 'cisco-567.my(P,1868872)', 'sitename': 'cisco-567.my', 'rn': 9, 'win': 'P', 'id': 1868872}, {
            'title': 'cisco-621.my(P,1871092)',
            'sitename': 'cisco-621.my',
            'rn': 10,
            'win': 'P',
            'id': 1871092
          }, {'title': 'cisco-752.my(P,1855942)', 'sitename': 'cisco-752.my', 'rn': 11, 'win': 'P', 'id': 1855942}, {
            'title': 'cisco-790.my(P,1858452)',
            'sitename': 'cisco-790.my',
            'rn': 12,
            'win': 'P',
            'id': 1858452
          }, {
            'title': 'cisco-apac-test(P,953282)',
            'sitename': 'cisco-apac-test',
            'rn': 13,
            'win': 'P',
            'id': 953282
          }, {
            'title': 'Cisco-APAC-test-obsoleted(P,731202)',
            'sitename': 'Cisco-APAC-test-obsoleted',
            'rn': 14,
            'win': 'P',
            'id': 731202
          }, {'title': 'cisco-chat(P,557722)', 'sitename': 'cisco-chat', 'rn': 15, 'win': 'P', 'id': 557722}, {
            'title': 'cisco-chat-test(P,803182)',
            'sitename': 'cisco-chat-test',
            'rn': 16,
            'win': 'P',
            'id': 803182
          }, {
            'title': 'cisco-chat-test-20120214(P,557643)',
            'sitename': 'cisco-chat-test-20120214',
            'rn': 17,
            'win': 'P',
            'id': 557643
          }, {
            'title': 'cisco-chat-test-obsolete-20141027(P,557663)',
            'sitename': 'cisco-chat-test-obsolete-20141027',
            'rn': 18,
            'win': 'P',
            'id': 557663
          }, {
            'title': 'cisco-chat-test-obsolete1-20141027(P,623222)',
            'sitename': 'cisco-chat-test-obsolete1-20141027',
            'rn': 19,
            'win': 'P',
            'id': 623222
          }, {
            'title': 'cisco-chat-test-obsoleted-2015-01-21-07-58-27(P,691429)',
            'sitename': 'cisco-chat-test-obsoleted-2015-01-21-07-58-27',
            'rn': 20,
            'win': 'P',
            'id': 691429
          }]
        }
        let that = this
        let url = config.avwatch_request_prefix + '/rest/tahoe/summary/'
        let params = {}
//        this.axios.get(url, {params: params}).then(response => {
        that.site = response.items
        /*}).catch(e => {
         console.error('Load data error', e.message)
         })*/
      },
      remoteSiteMethod (query) {
        console.log('query', query)
        let that = this
        if (query !== '') {
          this.loading = true
          let url = config.avwatch_request_prefix + '/rest/tahoe/summary/'
          let params = {}
          let response = {
            'id': 'root',
            'title': 'site list',
            'totalItems': 20,
            'identifier': 'id',
            'items': [{
              'title': 'cisco-175.my(P,1877397)',
              'sitename': 'cisco-175.my',
              'rn': 3,
              'win': 'P',
              'id': 1877397
            }, {
              'title': 'cisco-20110714(B,222718)',
              'sitename': 'cisco-20110714',
              'rn': 4,
              'win': 'B',
              'id': 222718
            }, {'title': 'cisco-216.my(P,1865677)', 'sitename': 'cisco-216.my', 'rn': 5, 'win': 'P', 'id': 1865677}, {
              'title': 'cisco-238.my(P,1871157)',
              'sitename': 'cisco-238.my',
              'rn': 6,
              'win': 'P',
              'id': 1871157
            }, {'title': 'cisco-493.my(P,1869802)', 'sitename': 'cisco-493.my', 'rn': 7, 'win': 'P', 'id': 1869802}, {
              'title': 'cisco-507.my(P,1842742)',
              'sitename': 'cisco-507.my',
              'rn': 8,
              'win': 'P',
              'id': 1842742
            }, {'title': 'cisco-567.my(P,1868872)', 'sitename': 'cisco-567.my', 'rn': 9, 'win': 'P', 'id': 1868872}, {
              'title': 'cisco-621.my(P,1871092)',
              'sitename': 'cisco-621.my',
              'rn': 10,
              'win': 'P',
              'id': 1871092
            }, {'title': 'cisco-752.my(P,1855942)', 'sitename': 'cisco-752.my', 'rn': 11, 'win': 'P', 'id': 1855942}, {
              'title': 'cisco-790.my(P,1858452)',
              'sitename': 'cisco-790.my',
              'rn': 12,
              'win': 'P',
              'id': 1858452
            }, {
              'title': 'cisco-chat-test-obsoleted-2015-01-21-07-58-27(P,691429)',
              'sitename': 'cisco-chat-test-obsoleted-2015-01-21-07-58-27',
              'rn': 20,
              'win': 'P',
              'id': 691429
            }]
          }
//        this.axios.get(url, {params: params}).then(response => {
          that.site = response.items
          that.loading = false
          /*that.site = response.items.filter(item => {
           return item.label.toLowerCase().indexOf(query.toLowerCase()) > -1
           })*/
          /*}).catch(e => {
           console.error('Load data error', e.message)
           })*/
        }
      },
      changeWeekly (e) {
        console.log(e)
        console.log($('.el-date-editor--week input').text())
      }
    }
  }
</script>
