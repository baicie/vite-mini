import { createApp } from 'vue'
import './style.css'
import ant from 'ant-design-vue'
import App from './App.vue'

const app = createApp(App)
app.use(ant)
app.mount('#app')
