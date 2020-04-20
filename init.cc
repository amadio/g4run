#include "init.h"

#include "actions.h"
#include "primary.h"

void InitializationAction::Build() const
{
  SetUserAction(new RunAction());
  SetUserAction(new PrimaryGeneratorAction());
}
