<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({ middleware: 'auth' })

const { data: session } = await authClient.useSession(useFetch)

async function handleSignOut() {
  await authClient.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Selamat datang kembali!</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-1">
          <p class="text-sm text-muted-foreground">
            Nama
          </p>
          <p class="font-medium">
            {{ session?.user?.name }}
          </p>
        </div>
        <div class="space-y-1">
          <p class="text-sm text-muted-foreground">
            Email
          </p>
          <p class="font-medium">
            {{ session?.user?.email }}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" class="w-full" @click="handleSignOut">
          Logout
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
