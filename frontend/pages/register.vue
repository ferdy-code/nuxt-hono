<script setup lang="ts">
import { signUp } from '~/lib/auth-client'

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const result = await signUp.email({
      name: name.value,
      email: email.value,
      password: password.value,
    })
    if (result.error) {
      error.value = result.error.message ?? 'Registrasi gagal'
    }
    else {
      await navigateTo('/')
    }
  }
  catch {
    error.value = 'Terjadi kesalahan. Coba lagi.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Daftar</CardTitle>
        <CardDescription>Buat akun baru</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="name">Nama</Label>
            <Input
              id="name"
              v-model="name"
              type="text"
              placeholder="Nama lengkap"
              autocomplete="name"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="email@contoh.com"
              autocomplete="email"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            />
          </div>
          <p v-if="error" class="text-sm text-destructive">
            {{ error }}
          </p>
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Memproses...' : 'Daftar' }}
          </Button>
        </form>
      </CardContent>
      <CardFooter class="justify-center">
        <p class="text-sm text-muted-foreground">
          Sudah punya akun?
          <NuxtLink to="/login" class="text-primary hover:underline font-medium">
            Login
          </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
