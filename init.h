#ifndef _INIT_H
#define _INIT_H

#include <G4VUserActionInitialization.hh>

class InitializationAction final : public G4VUserActionInitialization {
public:
	void Build() const override;
};

#endif
