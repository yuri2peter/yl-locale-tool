const dir = $_GET['dir'];
if (!dir) {
  alert('目录未指定！');
  redirect('./select-dir.html');
}
const app = new Vue({
  el: '#app',
  data: function () {
    return {
      id: 0,
      langTypes: [],
      messages: {},
      langs: {},
      tree: {},
      filterText: '',
    }
  },
  created: function () {
    console.log('App created.');
    this.load();
  },
  watch: {
    filterText: debounce(function (val) {
      this.$refs.tree.filter(val);
    }, 300)
  },
  methods: {
    getId() {
      return this.id++;
    },
    filterNode (value, data) {
      if (!value) return true;
      const match = (needle, str) => {
        return !!str && str.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
      };
      let rel = match(value, data.label) || match(value, data.path);
      this.langTypes.forEach(t => {
        rel = rel || match(value, data[t])
      });
      return rel;
    },
    getNewNode() {
      const node = {
        label: '__NEW__',
        id: this.getId(),
        path: '',
      };
      this.langTypes.forEach(t => {
        node[t] = '';
      });
      return node;
    },
    load() {
      const that = this;
      $.post("./server",
        {
          type: 'getFileData',
          payload: dir,
        },
        function (res) {
          if(!res.success) { alert('获取数据失败');return; }
          const { data: { messages, langs } } = res;
          that.messages = JSON.parse(messages);
          for (const i in langs) {
            that.langs[i] = JSON.parse(langs[i])
          }
          that.fetchTree();
        },
        'json',
      );
    },
    fetchTree() {
      const { messages, langs } = this;
      const that = this;
      that.langTypes = Object.keys(langs);
      const tree = { label: 'locale', children: [] };
      const fetch = function ({ key, value }, parent) {
        const newNode = that.getNewNode();
        if (typeof value === 'string') {
          Object.assign(newNode, {
            label: key,
            path: value,
          });
          that.langTypes.forEach(t=>{
            newNode[t] = that.localeMessage(value, langs[t])
          });
          parent.children.push(newNode)
        } else {
          Object.assign(newNode, {
            label: key,
            children: [],
          });
          for (const i in value) {
            fetch({ key: i, value: value[i] }, newNode)
          }
          parent.children.push(newNode)
        }
      };
      fetch({ key: 'LOCALE', value: messages, id: 0 }, tree);
      this.tree = tree.children[0].children;
      this.filterText = '';
      this.$notify({
        title: '刷新成功',
        message: '语言信息已成功从文件获取',
        type: 'success'
      });
    },
    append(id) {
      this.$refs.tree.append(this.getNewNode(), id)
    },
    insertAfter(id) {
      this.$refs.tree.insertAfter(this.getNewNode(), id)
    },
    remove(id) {
      this.$refs.tree.remove(id)
    },
    localeMessage(message, lang) {
      try {
        const path = message.split('.');
        let rel = { ...lang };
        path.forEach((t) => {
          rel = rel[t];
        });
        return rel || message;
      } catch (e) {
        return message || '[NOT FOUND]';
      }
    },
    save(){
      const { tree, langTypes } = this;
      console.log(tree);
      const messages = {}, langs = {};
      const parseMessages = (node, path, parent) => {
        const newPath = node.label!=='root' ? [...path, node.label] : [...path];
        if (node.children) {
          const val = {};
          for (const i in node.children) {
            parseMessages(node.children[i], newPath, val)
          }
          parent[node.label] = val;
        } else {
          parent[node.label] = newPath.join('.');
        }
      };
      parseMessages({ label: 'root', children: tree }, [], messages);
      console.log(messages);
      const parseLang = (node, type, parent) => {
        if (node.children) {
          const val = {};
          for (const i in node.children) {
            parseLang(node.children[i], type, val)
          }
          parent[node.label] = val;
        } else {
          parent[node.label] = node[type];
        }
      };
      langTypes.forEach(type => {
        const lang = {};
        parseLang({ label: 'root', children: tree }, type, lang);
        langs[type] = lang.root;
      });
      const langsStringify = {};
      for (const type in langs) {
        langsStringify[type] = JSON.stringify(langs[type], null, 2)
      }
      $.post("./server",
        {
          type: 'saveFileData',
          payload: {
            dir,
            messages: JSON.stringify(messages.root, null, 2),
            langs: langsStringify,
          },
        },
        (res) => {
          if(!res.success) { alert('存储数据失败');return; }
          this.$notify({
            title: '保存成功',
            message: '存储数据成功',
            type: 'success'
          });
          setTimeout(this.load, 500);
        },
        'json'
      );
    },
    onSave(){
      this.$confirm('确认保存至文件？')
        .then(_ => {
          this.save()
        })
    }
  }
});
