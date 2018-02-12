<template>
  <div style="max-height: 800px;">

    <div class="row">

      <div class="col">
        <Bridgecapacityusage @refreshDialog="addDialogComponent" keep-alive></Bridgecapacityusage>
      </div>

      <div class="col">
        <Webextotalminutes @refreshDialog="addDialogComponent" keep-alive></Webextotalminutes>
      </div>


    </div>

    <div class="row mt-2">

      <div class="col">
        <Totalsite @refreshDialog="addDialogComponent" keep-alive></Totalsite>
      </div>

      <div class="col">
        <Ccaauidominutescallin @refreshDialog="addDialogComponent" keep-alive></Ccaauidominutescallin>
      </div>


      <!--
      <div class="col">
        <Ccaauidominutescallin @refreshDialog="addDialogComponent" keep-alive></Ccaauidominutescallin>
      </div>

      <div class="col">
        <Ccaauidominutescallout @refreshDialog="addDialogComponent" keep-alive></Ccaauidominutescallout>
      </div>
       <div class="col">
         <Ccaportpeak @refreshDialog="addDialogComponent" keep-alive></Ccaportpeak>
       </div>-->
    </div>

    <!-- <div class="row">
       <div class="col">
         <Sitescalltypepeak @refreshDialog="addDialogComponent" keep-alive></Sitescalltypepeak>
       </div>
     </div>-->

    <el-dialog :title="dialogComponent.title" width="1020px" :visible.sync="dialogTableVisible"
               v-loading="loading">
      <div :is="dialogComponent.component" :text="dialogComponent.title"></div>
    </el-dialog>
  </div>


</template>

<script>
  import { mapGetters } from 'vuex'
  import Bridgecapacityusage from 'components/avwatch/telephony/summary/bridgecapacityusage/bridgecapacityusage'
  import bridgecapacityusagedetailchart from 'components/avwatch/telephony/summary/bridgecapacityusage/bridgecapacityusagedetail-chart'
  import bridgecapacityusagedetailtable from 'components/avwatch/telephony/summary/bridgecapacityusage/bridgecapacityusagedetail-table'
  import Webextotalminutes from 'components/avwatch/telephony/summary/webextotalminutes/webextotalminutes'
  import webextotalminutesdetailchart from 'components/avwatch/telephony/summary/webextotalminutes/webextotalminutesdetail-chart'
  import webextotalminutesdetailtable from 'components/avwatch/telephony/summary/webextotalminutes/webextotalminutesdetail-table'
  import Totalsite from 'components/avwatch/telephony/summary/totalsite/totalsite'
  import totalsitedetailchart from 'components/avwatch/telephony/summary/totalsite/totalsitedetail-chart'
  import totalsitedetailtable from 'components/avwatch/telephony/summary/totalsite/totalsitedetail-table'
  import Ccaauidominutescallin from 'components/avwatch/telephony/summary/ccaauidominutescallin/ccaauidominutescallin'
  import ccaauidominutescallindetailchart from 'components/avwatch/telephony/summary/ccaauidominutescallin/ccaauidominutescallindetail-chart'
  import ccaauidominutescallindetailtable from 'components/avwatch/telephony/summary/ccaauidominutescallin/ccaauidominutescallindetail-table'
  import Ccaauidominutescallout from 'components/avwatch/telephony/summary/ccaauidominutescallout/ccaauidominutescallout'
  import ccaminutescalloutdetailchart from 'components/avwatch/telephony/summary/ccaauidominutescallout/ccaminutescalloutdetail-chart'
  import ccaminutescalloutdetailtable from 'components/avwatch/telephony/summary/ccaauidominutescallout/ccaminutescalloutdetail-table'
  import Ccaportpeak from 'components/avwatch/telephony/summary/ccaportpeak/ccaportpeak'
  import ccaportpeakdetailchart from 'components/avwatch/telephony/summary/ccaportpeak/ccaportpeakdetail-chart'
  import ccaportpeakdetailtable from 'components/avwatch/telephony/summary/ccaportpeak/ccaportpeakdetail-table'
  import Sitescalltypepeak from 'components/avwatch/telephony/summary/sitescalltypepeak/sitescalltypepeak'
  import sitescalltypepeakdetailtable from 'components/avwatch/telephony/summary/sitescalltypepeak/sitescalltypepeakdetail-table'

  export default {
    name: 'summary',
    components: {
      // for widget
      Bridgecapacityusage: Bridgecapacityusage,
      Webextotalminutes: Webextotalminutes,
      Totalsite: Totalsite,
      Ccaauidominutescallin: Ccaauidominutescallin,
      Ccaauidominutescallout: Ccaauidominutescallout,
      Ccaportpeak: Ccaportpeak,
      Sitescalltypepeak: Sitescalltypepeak,
      // for chart table detail
      'bridgecapacityusagedetail-chart': bridgecapacityusagedetailchart,
      'bridgecapacityusagedetail-table': bridgecapacityusagedetailtable,
      'ccaauidominutescallindetail-chart': ccaauidominutescallindetailchart,
      'ccaauidominutescallindetail-table': ccaauidominutescallindetailtable,
      'ccaminutescalloutdetail-chart': ccaminutescalloutdetailchart,
      'ccaminutescalloutdetail-table': ccaminutescalloutdetailtable,
      'ccaportpeakdetail-chart': ccaportpeakdetailchart,
      'ccaportpeakdetail-table': ccaportpeakdetailtable,
      'sitescalltypepeakdetail-table': sitescalltypepeakdetailtable,
      'totalsitedetail-chart': totalsitedetailchart,
      'totalsitedetail-table': totalsitedetailtable,
      'webextotalminutesdetail-chart': webextotalminutesdetailchart,
      'webextotalminutesdetail-table': webextotalminutesdetailtable
    },
    data () {
      return {
        msg: 'Welcome to Your Vue.js App',
        dialogTitle: '',
        dialogTableVisible: false,
        dialogComponent: {},
        loading: true,
        qryConditons: {
          dateType: 'daily',
          daily: ['2017-11-11', '2017-11-11'],
          weekly: ['', ''],
          monthly: ['', ''],
          cloud: 'ats',
          datacenter: 'dc',
          server: '',
          cluster: '',
          site: '',
          bridge: ''
        }
      }
    },
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
      /*
      let myConditions = {
        daily: true,
        weekly: false,
        monthly: true,
        cloud: true,
        datacenter: true,
        server: true,
        cluster: false,
        site: false,
        bridge: false
      } */
      this.$store.dispatch('initPageFilters', this.qryConditons)
      this.initQryConditions()
    },
    methods: {
      initQryConditions () {
        console.log('0  initQryConditions.....')
        let qryConditons = {
          dateType: 'daily',
          daily: ['2017-11-11', '2017-11-11'],
          weekly: ['', ''],
          monthly: ['', ''],
          cloud: 'ats',
          datacenter: 'dc',
          server: '',
          cluster: '',
          site: '',
          bridge: ''
        }
        this.$store.dispatch('updateQryConditions', qryConditons)
      },
      clickChild () {
        this.$refs.bridgecapacityusage.showChart1('parent click ...')
        console.log('$refs', this.$refs)
        console.log(this.$emit)
      },
      addDialogComponent (component) {
        this.loading = true
        this.dialogTableVisible = true
        this.dialogComponent = component
      }
    }
  }


</script>
