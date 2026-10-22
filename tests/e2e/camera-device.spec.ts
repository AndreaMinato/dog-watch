import { expect, test } from '@playwright/test'
import { createRoom, heldWakeLocks, hideAndShow, joinAsCamera, openDevice, releaseWakeLocks } from './devices'

test('the camera keeps the screen on', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  await expect.poll(() => heldWakeLocks(camera)).toBe(1)
})

test('the camera takes the screen lock back when it becomes visible again', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expect.poll(() => heldWakeLocks(camera)).toBe(1)

  await releaseWakeLocks(camera)
  await hideAndShow(camera)

  await expect.poll(() => heldWakeLocks(camera)).toBe(1)
})
