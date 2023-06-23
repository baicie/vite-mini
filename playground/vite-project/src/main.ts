import { createApp } from 'vue'
import './style.css'
import ant from 'ant-design-vue'
import App from './App.vue'
import HelloWorld from './components/HelloWorld.vue'

const app = createApp(App)
app.use(ant)
app.component('HelloWorld', HelloWorld)
app.mount('#app')
