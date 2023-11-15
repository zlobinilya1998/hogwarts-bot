<template>
    <div>
        <div class="divide-y divide-sky-400">
            <div class="text-sky-500 text-center p-4 font-bold text-2xl">HOGWARTS LOGS</div>
            <div class="mt-4 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4" v-for="encounter in encounters">
                    <div class="border-1 p-4 divide-y divide-sky-300">
                        <div class="flex items-center">
                            <img :src="encounter.image" alt="boss-img" class="-mx-5 pb-2"/>
                            <p class="text-amber-500 font-bold text-lg" v-text="encounter.title"></p>
                            <a :href="encounter.link" target="_blank" class="ml-auto text-sky-100 hover:text-sky-600">Ссылка на энкаунтер &rarr;</a>
                        </div>
                        <div class="divide-y divide-gray-300/50 pt-4">
                            <div class="space-y-6 text-base leading-7 text-gray-600" v-if="encounter.items.length">
                                <p class="text-center text-md font-bold text-sky-500">Добыча</p>
                                <ul class="space-y-2">
                                    <li v-for="item in encounter.items" >
                                        <a :href="item.link" target="_blank" class="flex items-center hover:underline">
                                            <img :src="item.image" alt="item-img" />
                                            <div class="text-purple-600 ml-2" v-text="item.title"/>
                                        </a>

                                    </li>
                                </ul>
                            </div>
                            <div class="space-y-6 text-base leading-7 text-gray-600" v-else>
                                <p class="text-center text-md font-bold text-sky-500">Добыча для данного босса нет</p>
                            </div>
                        </div>
                    </div>
                </div>
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
    console.log(encounters.value)
}
getEncounters()

</script>


<style>
body {
    background-color: rgb(15 23 42);
}
</style>
