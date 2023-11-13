
<template>
    <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4" v-for="encounter in encounters">
            <img src="https://logs.stormforge.gg/images/pve/boss_icon_chess_event.webp?v=U2y6s13jtgz7fubFCmnr7VcgIfRQyRVGC3mx7UY0ETQ"/>
            <div class="grid grid-cols-1 sm:grid-cols-2 text-gray-200 mt-2">
                <a target="_blank" class="text-cyan-400" :href="encounter.link">{{encounter.title}}</a>
                <div>{{encounter.date}}</div>
                <div>{{encounter.name}}</div>
            </div>
        </div>
    </div>

</template>

<script setup lang="ts">
import {ref} from "vue";

let encounters = ref([]);
const getEncounters = async () => {
    const resp = await fetch('http://localhost:3001/encounters')
    encounters.value = await resp.json()
}
getEncounters()

</script>


<style>
body {
    background-color: rgb(15 23 42);
}
</style>
