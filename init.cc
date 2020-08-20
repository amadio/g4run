#include "init.h"

#include "actions.h"
#include "primary.h"

void InitializationAction::Build() const
{
	SetUserAction(new RunAction());

#if !USE_PYTHIA
	SetUserAction(new PrimaryGeneratorAction());
#else
	if (use_pythia())
		SetUserAction(new PythiaPrimaryGeneratorAction());
	else
		SetUserAction(new PrimaryGeneratorAction());
#endif
}
