import { StateMachine } from './state-machine.js';
import { KeybindHandler } from './keybind.js';
import { Overlay } from './overlay.js';
import { TargetingHandler } from './targeting.js';
import type { ClientConfig } from 'astro-grab-shared';

export class AstroGrab {
   private stateMachine: StateMachine;
   private keybind: KeybindHandler;
   private overlay: Overlay;
   private targeting: TargetingHandler;

   constructor(config: ClientConfig = {}) {
     const { holdDuration = 1000, contextLines = 4 } = config;

     this.stateMachine = new StateMachine();
     this.keybind = new KeybindHandler(this.stateMachine, holdDuration);
     this.overlay = new Overlay(this.stateMachine);
     this.targeting = new TargetingHandler(this.stateMachine, this.overlay, contextLines);
   }

   init(): void {
     this.keybind.init();
     this.overlay.init();
     this.targeting.init();
     console.log('[astro-grab] Initialized - Hold Cmd/Ctrl+G to start');
   }

   destroy(): void {
     this.keybind.destroy();
     this.overlay.destroy();
   }
 }

 export type { ClientConfig } from 'astro-grab-shared';
