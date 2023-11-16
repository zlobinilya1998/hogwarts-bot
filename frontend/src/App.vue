<template>
    <div class="pb-4">
        <div class="text-sky-500 text-center p-4 font-bold text-2xl">HOGWARTS LOGS</div>
        <table class="table-fixed border-spacing-4 border-collapse mx-auto">
            <thead>
            <tr class="text-sky-500">
                <th class="border border-slate-600">Boss</th>
                <th class="border border-slate-600">Loot</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="encounter in encounters" class="border border-slate-600">
                <td class="p-2 border border-slate-600">
                    <a :href="encounter.link" target="_blank">
                        <div class="flex items-center">
                            <img :src="encounter.image" alt="boss-img" class="-mx-5 pb-2"/>
                            <p class="text-amber-500 font-bold text-lg underline" v-text="encounter.title"></p>
                        </div>
                    </a>
                </td>
                <td class="p-2 border border-slate-600">
                    <ul class="space-y-2">
                        <li v-for="item in encounter.items">
                            <a :href="item.link" target="_blank" class="flex items-center hover:underline">
                                <img :src="item.image" alt="item-img"/>
                                <div class="text-purple-600 ml-2" v-text="item.title"/>
                            </a>

                        </li>
                    </ul>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
import {ref} from "vue";

let encounters = ref([]);
const getEncounters = async () => {
    const resp = await fetch('http://localhost:3001/encounters')
    encounters.value = await resp.json()
    console.log(encounters.value)
}
getEncounters()

</script>


<style>
body {
    background-color: rgb(15 23 42);
}
</style>
