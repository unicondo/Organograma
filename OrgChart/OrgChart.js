Vue.component("org-chart", {
  template: `
      <div>
        <org-chart-desktop class="d-none" :class="desktop_display_class" :root="orgChart_data.root" :connector_color="options.connector_color"></org-chart-desktop>
        <org-chart-mobile class="d-flex" :class="mobile_hidden_class" :root="orgChart_data.root" :show_all_label="options.show_all_label" :hide_all_label="options.hide_all_label"></org-chart-mobile>
      </div>
      `,
  props: {
    orgChart_data: Object
  },
  data:function(){
    // options : default options value
    return {
      options:{
        mobile_breakpoint:'sm',
        connector_color:'#d1b80c',
        show_all_label:'Show All',
        hide_all_label:'Hide All',
      }
    }
  },
  created(){
    // override default options value if provided
    if (this.orgChart_data.hasOwnProperty("options")){
      Object.assign(this.options,this.orgChart_data.options);
    }
  },
  computed: {
    desktop_display_class: function() {
      return `d-${this.options.mobile_breakpoint}-flex`;
    },
    mobile_hidden_class: function() {
      return `d-${this.options.mobile_breakpoint}-none`;
    },
  }
});

Vue.component("org-chart-desktop", {
  template: `
<div class="orgChartDesktopWrapper container" ref="orgChartDesktopWrapper">
<ul class="orgChartDesktop" ref="orgChartDesktop" :style="{'--connector-color':connector_color}">
  <org-chart-desktop-branch class="orgChartDesktopRoot" :branch_data="branch_data"></org-chart-desktop-branch>        
</ul>
</div>
`,
  props: {
    root:Object,
    connector_color:String,
  },
  computed: {
    branch_data:function(){
      return this.root;
    },
    isIOS:function(){
      return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    },
    isIE:function(){
      return (window.document.documentMode) ? true : false;
    },
  },
  methods: {
    fitOrgChartWithWrapper: function() {
      const orgchart_wrapper = this.$refs.orgChartDesktopWrapper;
      const orgchart = this.$refs.orgChartDesktop;
      const ratio = orgchart_wrapper.clientWidth / orgchart.clientWidth;
      if (ratio < 1) {
        orgchart_wrapper.style.setProperty(
          "height",
          `${orgchart.scrollHeight * ratio}px`
        );
        orgchart.style.setProperty("transform", `scale(${ratio})`);
      } else {
        orgchart.style.setProperty("transform", "none");
        orgchart_wrapper.style.setProperty("height", "auto");
      }
    },
    initCSS: function() {
      const orgchart = this.$refs.orgChartDesktop;
      if (this.isIE) {
        // fix IE render problem
        orgchart.style.setProperty("transform-origin", "top left");
        orgchart.style.setProperty("display", "block");
      }
      if (this.isIOS) {
        // fix IOS render problem
        orgchart.querySelectorAll(".orgChartDesktopNode").forEach(function(ele) {
          ele.style.setProperty("display", "block", "important");
          ele.style.setProperty("height", "auto", "important");
        });
      }
      this.fitOrgChartWithWrapper();
    }
  },
  mounted() {
    this.initCSS();
  },
  created() {
    window.addEventListener("load", this.initCSS);
    window.addEventListener("resize", this.fitOrgChartWithWrapper);
  },
  destroyed() {
    window.removeEventListener("load", this.initCSS);
    window.removeEventListener("resize", this.fitOrgChartWithWrapper);
  }
});

Vue.component("org-chart-desktop-branch", {
  template: `
  <li class="orgChartDesktopBranch" :class="branch_class">
    <org-chart-desktop-node :node_data="branch_data.node"></org-chart-desktop-node>
    <org-chart-desktop-branches v-if="branch_data.hasOwnProperty('branches')" :branches_data="branch_data.branches"></org-chart-desktop-branches>  
  </li>
  `,
  props: {
    branch_data: Object
  },
  computed: {
    branch_class: function() {
      // default assume it is leaf, has no sub branches
      let foo = "orgChartDesktopLeaf";
      if (this.branch_data.hasOwnProperty("branches")) {
        // if it has sub branches, it must not a leaf
        foo = "";
        if (this.branch_data.branches.hasOwnProperty("vertical_breakpoint")) {
          // the sub branches can be in vertical mode at breakpoints :
          // sm, md, lg, xl
          // * : force vertical mode
          if ('*'==this.branch_data.branches.vertical_breakpoint){
            foo = `orgChartDesktop-vBranch`;
          }else{
            foo = `orgChartDesktop-${this.branch_data.branches.vertical_breakpoint}-vBranch`;
          }
        }
      }
      return foo;
    }
  }
});

Vue.component("org-chart-desktop-branches", {
  template: `
<ul class="orgChartDesktopBranches">
  <org-chart-desktop-branch v-for="(branch,index) in branches_data.items" :branch_data="branch" :key="index"></org-chart-desktop-branch>
</ul>
`,
  props: {
    branches_data: Object
  }
});

Vue.component("org-chart-desktop-node", {
  template: `  
  <b-link v-if="hasLink" :class="node_data.classes" :href="node_data.link" class="orgChartDesktopNode" v-html="node_data.html">
  </b-link>
  <div v-else :class="node_data.classes"  class="orgChartDesktopNode" v-html="node_data.html">
  </div>
    `,
  props: {
    node_data: Object
  },
  computed: {
    hasLink: function() {
      if (this.node_data.link)
      return true;
        else
      return false;
    }
  }
});

Vue.component("org-chart-mobile", {
  template: `
<div class="flex-column justify-content-center align-items-center w-100">
  <b-button @click="btn_click">{{btn_label}}</b-button>
  <org-chart-mobile-branch class="orgChartMobile my-3 w-100" :branch_data="branch_data" :boxes_status="boxes_status" :level="0"></org-chart-mobile-branch>
</div>
`,
  props: {
    root: Object,
    show_all_label:String,
    hide_all_label:String,
  },
  data: function() {
    return {
      btnState: "showall",
      boxes_status: {
        ids: {},
        thisComponent: {},
        newId: function() {
          const id=this.id_generator();
          this.ids[id] = { isopen: false };
          return id;
        },
        showall: function() {
          const ids = this.ids;
          Object.keys(ids).forEach(key => {
            if (false == ids[key]["isopen"])
              this.thisComponent.$root.$emit("bv::toggle::collapse", key);
          });
        },
        hideall: function() {
          const ids = this.ids;
          Object.keys(ids).forEach(key => {
            if (ids[key]["isopen"])
              this.thisComponent.$root.$emit("bv::toggle::collapse", key);
          });
        },
        update: function(id, isopen) {
          this.ids[id]["isopen"] = isopen;
        },
        refreshBtnState: function() {
          let result = "hideall";
          Object.keys(this.ids).forEach(key => {
            if (false == this.ids[key]["isopen"]) result = "showall";
          });
          this.thisComponent.btnState=result;
        },
        id_generator: function() {
          let result = "";
          const length = 10;
          const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          const charactersLength = characters.length;
          for (let i = 0; i < length; i++) {
            result += characters.charAt(
              Math.floor(Math.random() * charactersLength)
            );
          }
          return result;
        }
      }
    };
  },
  methods: {
    btn_click: function() {
      if ("showall" == this.btnState) this.boxes_status.showall();
      else this.boxes_status.hideall();
    }
  },
  computed: {
    branch_data:function(){
      return this.root;
    },
    btn_label: function() {
      const label = {
        showall: this.show_all_label,
        hideall: this.hide_all_label
      };
      return label[this.btnState];
    }
  },
  created() {
    this.boxes_status.thisComponent = this;
  }
});

Vue.component('org-chart-mobile-branch',{
  template:`
  <div>
    <org-chart-mobile-node
    v-if="false==isNoBody"
    :collapse_id="get_collapse_id"
    :node_data="branch_data.node" 
    :hasMoreBranches="hasMoreBranches"
    :level="level"></org-chart-mobile-node>
    <org-chart-mobile-branches 
    v-if="hasMoreBranches"
    :boxes_status="boxes_status"
    @collapseChanged="collapsed_changed"
    :branches_data="branch_data.branches" 
    :parent_collapse_id="isNoBody?parent_collapse_id:get_collapse_id"
    :level="level + 1" ></org-chart-mobile-branches>
  </div>
  `,
  props:{
    branch_data:Object,
    parent_collapse_id:String,
    boxes_status:Object,
    level:Number,
  },
  data:function(){
    return {
      collapse_id:'',
    }
  },
  computed:{
    isNoBody:function(){
      if (this.branch_data.node.hasOwnProperty('classes')){
        return this.branch_data.node.classes.includes("nobody_line");
      }
      return false;
    },
    hasMoreBranches:function(){
      return this.branch_data.hasOwnProperty('branches');
    },
    get_collapse_id: function() {
      if (this.collapse_id) {
        return this.collapse_id;
      }
      if (false==this.isNoBody && this.hasMoreBranches){
        this.collapse_id = this.boxes_status.newId();
      }
      return this.collapse_id;
    },
  },
  methods:{
    collapsed_changed:function(){
      this.boxes_status.refreshBtnState();
    },
  }
  
});

Vue.component("org-chart-mobile-branches", {
  template: `
  <b-collapse :id="parent_collapse_id" :class="branches_class" @shown="collapse_isopen(true)" @hidden="collapse_isopen(false)">
    <org-chart-mobile-branch v-for="(branch,index) in branches_data.items" :branch_data="branch" :key="index" :parent_collapse_id="parent_collapse_id" :boxes_status="boxes_status" :level="level"></org-chart-mobile-branch>
  </b-collapse>    
    `,
  props: {
    branches_data:Object,
    boxes_status: Object,
    parent_collapse_id: String,
    level: Number,
  },
  computed: {
    branches_class: function() {
      return `branches_level${this.level}`;
    },
  },
  methods: {
    collapse_isopen: function(isopen) {
      this.boxes_status.update(this.parent_collapse_id, isopen);
      this.$emit("collapseChanged");
    },
  }
});

Vue.component("org-chart-mobile-node", {
  template: `
    <div v-b-toggle=collapse_id class="d-flex border border-warning p-2 orgChartMobileNode" :class="node_level_class">
        <div class="d-flex flex-column justify-content-center" style="width:50px;">
            <template v-if="hasMoreBranches">
            <i class="when-opened fas fa-caret-down"></i>
            <i class="when-closed fas fa-caret-right"></i>
            </template>
        </div>
        <b-link v-if="hasLink"
            :href="node_data.link"
            v-html="node_data.html"
            class="d-flex flex-column justify-content-center">
        </b-link>
        <div v-else
            v-html="node_data.html"
            class="d-flex flex-column justify-content-center">
        </div>
    </div>    
    `,
  props: {
    node_data: {},
    collapse_id: String,
    hasMoreBranches: Boolean,
    level: Number
  },
  computed: {
    hasLink: function() {
      if (this.node_data.link)
      return true;
        else
      return false;
    },
    node_level_class: function() {
      return `node_level${this.level} ${this.node_data.classes}`;
    }
  }
});
