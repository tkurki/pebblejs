#include <pebble.h>
#include <pebblejs/simply.h>

int main(void) {
  Simply *simply = simply_init();
  app_event_loop();
  simply_deinit(simply);
}
